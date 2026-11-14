"""Real-ESRGAN (realesr-general-x4v3, SRVGGNetCompact) without PyTorch.

Reads the .pth weights with a restricted unpickler (only tensor-rebuild helpers are allowed, nothing else
can be instantiated), rebuilds the network as an ONNX graph, and runs it with onnxruntime in tiles.

usage: python -I upscale.py WEIGHTS.pth OUT_MODEL.onnx IN_IMAGE OUT_IMAGE [target_width]
"""
import collections
import pickle
import sys
import zipfile

import numpy as np
import onnx
import onnxruntime as ort
from onnx import TensorProto, helper, numpy_helper
from PIL import Image

DTYPES = {"FloatStorage": np.float32, "HalfStorage": np.float16, "DoubleStorage": np.float64}


def load_state_dict(path):
    zf = zipfile.ZipFile(path)
    prefix = zf.namelist()[0].split("/")[0]

    def rebuild(storage, offset, size, stride, *_):
        item = storage.itemsize
        view = np.lib.stride_tricks.as_strided(storage[offset:], shape=tuple(size), strides=[s * item for s in stride])
        return np.array(view, dtype=np.float32)

    class Restricted(pickle.Unpickler):
        def find_class(self, module, name):
            if module == "torch._utils" and name == "_rebuild_tensor_v2":
                return rebuild
            if module == "torch" and name in DTYPES:
                return name
            if module == "collections" and name == "OrderedDict":
                return collections.OrderedDict
            raise pickle.UnpicklingError(f"blocked: {module}.{name}")

        def persistent_load(self, pid):
            _, storage_type, key, _location, _numel = pid
            return np.frombuffer(zf.read(f"{prefix}/data/{key}"), dtype=DTYPES[storage_type])

    with zf.open(f"{prefix}/data.pkl") as f:
        obj = Restricted(f).load()
    return obj.get("params_ema") or obj.get("params") or obj


def build_onnx(sd, out_path, scale=4):
    convs = sorted({int(k.split(".")[1]) for k in sd if k.startswith("body.") and k.endswith(".weight") and sd[k].ndim == 4})
    nodes, inits = [], []
    x = "input"
    for idx in convs:
        w, b = sd[f"body.{idx}.weight"], sd[f"body.{idx}.bias"]
        inits += [numpy_helper.from_array(w, f"w{idx}"), numpy_helper.from_array(b, f"b{idx}")]
        nodes.append(helper.make_node("Conv", [x, f"w{idx}", f"b{idx}"], [f"c{idx}"], pads=[1, 1, 1, 1], kernel_shape=[3, 3]))
        x = f"c{idx}"
        act = f"body.{idx + 1}.weight"
        if act in sd:  # PReLU, one slope per channel
            inits.append(numpy_helper.from_array(sd[act].reshape(-1, 1, 1), f"a{idx}"))
            nodes.append(helper.make_node("PRelu", [x, f"a{idx}"], [f"p{idx}"]))
            x = f"p{idx}"
    nodes.append(helper.make_node("DepthToSpace", [x], ["up"], blocksize=scale, mode="CRD"))  # == nn.PixelShuffle
    inits.append(numpy_helper.from_array(np.array([1, 1, scale, scale], dtype=np.float32), "scales"))
    nodes.append(helper.make_node("Resize", ["input", "", "scales"], ["base"], mode="nearest"))
    nodes.append(helper.make_node("Add", ["up", "base"], ["output"]))
    graph = helper.make_graph(
        nodes,
        "srvgg",
        [helper.make_tensor_value_info("input", TensorProto.FLOAT, [1, 3, None, None])],
        [helper.make_tensor_value_info("output", TensorProto.FLOAT, [1, 3, None, None])],
        inits,
    )
    model = helper.make_model(graph, opset_imports=[helper.make_opsetid("", 17)], ir_version=8)
    onnx.checker.check_model(model)
    onnx.save(model, out_path)


def upscale(model_path, img, scale=4, tile=256, pad=16):
    sess = ort.InferenceSession(model_path, providers=["CPUExecutionProvider"])
    a = np.asarray(img.convert("RGB"), dtype=np.float32) / 255.0
    h, w, _ = a.shape
    out = np.zeros((h * scale, w * scale, 3), dtype=np.float32)
    for y in range(0, h, tile):
        for x in range(0, w, tile):
            y0, x0 = max(0, y - pad), max(0, x - pad)
            y1, x1 = min(h, y + tile + pad), min(w, x + tile + pad)
            patch = a[y0:y1, x0:x1].transpose(2, 0, 1)[None]
            res = sess.run(None, {"input": patch})[0][0].transpose(1, 2, 0)
            ty, tx = (y - y0) * scale, (x - x0) * scale
            th, tw = min(tile, h - y) * scale, min(tile, w - x) * scale
            out[y * scale : y * scale + th, x * scale : x * scale + tw] = res[ty : ty + th, tx : tx + tw]
    return Image.fromarray((np.clip(out, 0, 1) * 255 + 0.5).astype(np.uint8))


if __name__ == "__main__":
    weights, model_path, src, dst = sys.argv[1:5]
    target_w = int(sys.argv[5]) if len(sys.argv) > 5 else 0
    build_onnx(load_state_dict(weights), model_path)
    im = Image.open(src)
    big = upscale(model_path, im)
    if target_w and big.width > target_w:
        big = big.resize((target_w, round(big.height * target_w / big.width)), Image.LANCZOS)
    big.save(dst, quality=90, optimize=True, progressive=True)
    print(f"{src} {im.size} -> {dst} {big.size}")
