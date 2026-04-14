function toCsv(rows) {
  if (!rows.length) {
    return "";
  }

  const headers = Object.keys(rows[0]);
  const lines = [headers.join(",")];

  for (const row of rows) {
    const line = headers
      .map((header) => {
        const raw = row[header] == null ? "" : String(row[header]);
        const escaped = raw.replace(/"/g, '""');
        return `"${escaped}"`;
      })
      .join(",");
    lines.push(line);
  }

  return lines.join("\n");
}

function toXml(scanRecord) {
  const findingsXml = scanRecord.findings
    .map((finding) => {
      const recommendations = finding.recommendations
        .map((item) => `<recommendation>${escapeXml(item)}</recommendation>`)
        .join("");

      return [
        "<finding>",
        `<assetId>${escapeXml(finding.assetId)}</assetId>`,
        `<domain>${escapeXml(finding.domain)}</domain>`,
        `<tlsVersion>${escapeXml(finding.tlsVersion)}</tlsVersion>`,
        `<keyExchange>${escapeXml(finding.keyExchange)}</keyExchange>`,
        `<certificateAlgorithm>${escapeXml(finding.certificateAlgorithm)}</certificateAlgorithm>`,
        `<forwardSecrecy>${String(finding.forwardSecrecy)}</forwardSecrecy>`,
        `<pqcCompatible>${String(finding.pqcCompatible)}</pqcCompatible>`,
        `<riskScore>${String(finding.riskScore)}</riskScore>`,
        `<riskLevel>${escapeXml(finding.riskLevel)}</riskLevel>`,
        `<securityLabel>${escapeXml(finding.securityLabel)}</securityLabel>`,
        `<recommendations>${recommendations}</recommendations>`,
        "</finding>",
      ].join("");
    })
    .join("");

  return [
    '<?xml version="1.0" encoding="UTF-8"?>',
    "<scanReport>",
    `<scanId>${escapeXml(scanRecord.id)}</scanId>`,
    `<startedAt>${escapeXml(scanRecord.startedAt)}</startedAt>`,
    `<finishedAt>${escapeXml(scanRecord.finishedAt)}</finishedAt>`,
    `<assetCount>${String(scanRecord.assetCount)}</assetCount>`,
    `<scannedBy>${escapeXml(scanRecord.scannedBy.username)}</scannedBy>`,
    `<riskLow>${String(scanRecord.riskCounts.low)}</riskLow>`,
    `<riskMedium>${String(scanRecord.riskCounts.medium)}</riskMedium>`,
    `<riskHigh>${String(scanRecord.riskCounts.high)}</riskHigh>`,
    `<findings>${findingsXml}</findings>`,
    "</scanReport>",
  ].join("");
}

function escapeXml(value) {
  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/\"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

module.exports = {
  toCsv,
  toXml,
};
