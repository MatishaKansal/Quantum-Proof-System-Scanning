function buildCbom(asset) {
  const now = new Date().toISOString();
  const keyId = `${asset.id}-key`;

  return {
    assetId: asset.id,
    assetName: asset.name,
    generatedAt: now,
    algorithms: {
      name: asset.cipherSuite,
      assetType: "Algorithm",
      primitive: asset.certificateAlgorithm,
      mode: asset.cipherSuite.includes("GCM") ? "GCM" : "CBC",
    },
    cryptoFunctions: {
      cryptoFunctions: ["key_generation", "encryption", "decryption", "auth_tag"],
      classicalSecurityLevel: String(asset.keySize || "unknown"),
      oid: "1.2.840.113549",
      list: [asset.cipherSuite, asset.keyExchange, asset.certificateAlgorithm],
    },
    keys: {
      name: keyId,
      assetType: "Key",
      id: keyId,
      state: "active",
      size: asset.keySize,
      creationDate: now,
      activationDate: now,
    },
    protocols: {
      name: "TLS",
      assetType: "Protocol",
      version: asset.tlsVersion,
      cipherSuites: [asset.cipherSuite],
      oid: "1.3.6.1.5.5.7.3.1",
    },
    certificates: {
      name: `${asset.domain}-cert`,
      assetType: "Certificate",
      subjectName: `CN=${asset.domain}`,
      issuerName: "CN=PNB Internal CA",
      notValidBefore: "2026-01-01T00:00:00.000Z",
      notValidAfter: "2027-01-01T00:00:00.000Z",
      signatureAlgorithmReference: asset.certificateAlgorithm,
      subjectPublicKeyReference: asset.keyExchange,
      certificateFormat: "X.509",
      certificateExtension: ".crt",
    },
  };
}

module.exports = {
  buildCbom,
};
