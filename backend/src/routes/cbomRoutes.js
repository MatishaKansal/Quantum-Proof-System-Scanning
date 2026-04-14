const express = require("express");
const { listAssets, getAssetById } = require("../data/repository");
const { buildCbom } = require("../services/cbomService");

const router = express.Router();

router.get("/", async (_req, res) => {
  const assets = await listAssets();
  const cbom = assets.map((asset) => buildCbom(asset));
  return res.json({ count: cbom.length, data: cbom });
});

router.get("/:assetId", async (req, res) => {
  const asset = await getAssetById(req.params.assetId);

  if (!asset) {
    return res.status(404).json({ message: "Asset not found" });
  }

  return res.json({ data: buildCbom(asset) });
});

module.exports = router;
