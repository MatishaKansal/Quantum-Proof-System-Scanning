const https = require("https");
const tls = require("tls");

/**
 * Scan a website's TLS configuration
 * Returns actual cryptographic details from the certificate
 */
async function scanTLS(domain, endpoint) {
  return new Promise((resolve) => {
    try {
      // Parse domain from endpoint URL if needed
      let hostname = domain;
      try {
        const url = new URL(endpoint.startsWith("http") ? endpoint : `https://${endpoint}`);
        hostname = url.hostname;
      } catch (e) {
        hostname = domain;
      }

      console.log(`[TLS Scan] Starting scan for ${hostname}...`);

      const options = {
        hostname,
        port: 443,
        method: "GET",
        rejectUnauthorized: false,
      };

      const req = https.request(options, (res) => {
        const cert = res.socket.getPeerCertificate(true);
        const tlsVersion = res.socket.getProtocol();

        // Extract cipher and key exchange info
        const cipher = res.socket.getCipher();
        const cipherName = cipher?.name || "Unknown";

        console.log(`[TLS Scan] ${hostname} - TLS: ${tlsVersion}, Cipher: ${cipherName}`);

        // Determine key exchange from cipher suite
        let keyExchange = "Unknown";
        if (cipherName.includes("ECDHE")) {
          keyExchange = "ECDHE";
        } else if (cipherName.includes("DHE")) {
          keyExchange = "DHE";
        } else if (cipherName.includes("RSA")) {
          keyExchange = "RSA";
        } else if (cipherName.includes("PSK")) {
          keyExchange = "PSK";
        }

        // For TLS 1.3, default to ECDHE if we can't determine (TLS 1.3 always uses ephemeral keys)
        if (tlsVersion.includes("1.3") && keyExchange === "Unknown") {
          keyExchange = "ECDHE";
        }

        // Determine if forward secrecy is enabled
        const forwardSecrecy = keyExchange !== "RSA" && keyExchange !== "Unknown";

        // Get certificate algorithm and key size
        let certificateAlgorithm = "Unknown";
        let keySize = 0;
        let certValidFrom = null;
        let certValidTo = null;

        if (cert) {
          // Try to get subject alt name as additional info
          const pubkey = cert.pubkey;

          // Capture certificate validity window for expiry-risk weighting
          if (cert.valid_from) {
            certValidFrom = cert.valid_from;
          }
          if (cert.valid_to) {
            certValidTo = cert.valid_to;
          }

          // Parse key size from certificate details
          if (cert.bits) {
            keySize = cert.bits;
          }

          // Get signature algorithm
          if (cert.sigalg) {
            certificateAlgorithm = cert.sigalg;
          } else if (cert.modulus) {
            // Estimate from modulus length
            keySize = Math.floor(cert.modulus.length * 4); // Hex to bits
            certificateAlgorithm = "RSA";
          } else if (cert.asn1Curve) {
            certificateAlgorithm = `ECDSA/${cert.asn1Curve}`;
            keySize = parseInt(cert.asn1Curve) || 256;
          }
        }

        // Determine cipher suite
        const cipherSuite = cipherName || "Unknown";

        // Determine PQC compatibility
        const isPQCReady = forwardSecrecy && tlsVersion.includes("1.3");

        const result = {
          tlsVersion: tlsVersion || "Unknown",
          keyExchange,
          certificateAlgorithm: certificateAlgorithm || "Unknown",
          keySize: keySize || 0,
          cipherSuite,
          forwardSecrecy,
          pqcCompatible: isPQCReady,
          certValidFrom,
          certValidTo,
          scanSuccess: true,
        };

        console.log(`[TLS Scan] ${hostname} - Result:`, result);
        resolve(result);
      });

      req.on("error", (err) => {
        console.warn(`TLS scan failed for ${hostname}:`, err.message);
        // Return minimal data on error so scanService retries with actual values
        resolve({
          tlsVersion: "Unknown",
          keyExchange: "Unknown",
          certificateAlgorithm: "Unknown",
          keySize: 0,
          cipherSuite: "Unknown",
          forwardSecrecy: false,
          pqcCompatible: false,
          certValidFrom: null,
          certValidTo: null,
          scanSuccess: false,
          error: err.message,
        });
      });

      req.setTimeout(5000, () => {
        req.destroy();
        console.warn(`TLS scan timeout for ${hostname}`);
        resolve({
          tlsVersion: "Unknown",
          keyExchange: "Unknown",
          certificateAlgorithm: "Unknown",
          keySize: 0,
          cipherSuite: "Unknown",
          forwardSecrecy: false,
          pqcCompatible: false,
          certValidFrom: null,
          certValidTo: null,
          scanSuccess: false,
          error: "Connection timeout",
        });
      });

      req.end();
    } catch (error) {
      console.error(`TLS scan exception for ${hostname}:`, error.message);
      resolve({
        tlsVersion: "Unknown",
        keyExchange: "Unknown",
        certificateAlgorithm: "Unknown",
        keySize: 0,
        cipherSuite: "Unknown",
        forwardSecrecy: false,
        pqcCompatible: false,
        certValidFrom: null,
        certValidTo: null,
        scanSuccess: false,
        error: error.message,
      });
    }
  });
}

module.exports = {
  scanTLS,
};
