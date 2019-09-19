const docusign = require('docusign-esign');
const path = require('path');
const fs = require('fs');
const basePath = 'https://demo.docusign.net/restapi';
const express = require('express');
const port = process.env.PORT || 3000;
const host = process.env.HOST || 'localhost';

const sendEnvelopeController = async (req, res) => {
  // https://developers.docusign.com/oauth-token-generator
  const accessToken = process.env.ACCESS_TOKEN || req.query.ACCESS_TOKEN || 'eyJ0eXAiOiJKV1QiLCJhbGciOiJSUzI1NiIsImtpZCI6IjY4MTg1ZmYxLTRlNTEtNGNlOS1hZjFjLTY4OTgxMjIwMzMxNyJ9.eyJUb2tlblR5cGUiOjUsIklzc3VlSW5zdGFudCI6MTU2ODg4NTk4MiwiZXhwIjoxNTY4OTE0NzgyLCJVc2VySWQiOiJiMWQ0NDgyOC0zN2MxLTQwMTgtYjM5ZS0yOGVkMDc1NWRlNGUiLCJzaXRlaWQiOjEsInNjcCI6WyJzaWduYXR1cmUiLCJjbGljay5tYW5hZ2UiLCJvcmdhbml6YXRpb25fcmVhZCIsImdyb3VwX3JlYWQiLCJwZXJtaXNzaW9uX3JlYWQiLCJ1c2VyX3JlYWQiLCJ1c2VyX3dyaXRlIiwiYWNjb3VudF9yZWFkIiwiZG9tYWluX3JlYWQiLCJpZGVudGl0eV9wcm92aWRlcl9yZWFkIiwiZHRyLnJvb21zLnJlYWQiLCJkdHIucm9vbXMud3JpdGUiLCJkdHIuZG9jdW1lbnRzLnJlYWQiLCJkdHIuZG9jdW1lbnRzLndyaXRlIiwiZHRyLnByb2ZpbGUucmVhZCIsImR0ci5wcm9maWxlLndyaXRlIiwiZHRyLmNvbXBhbnkucmVhZCIsImR0ci5jb21wYW55LndyaXRlIl0sImF1ZCI6ImYwZjI3ZjBlLTg1N2QtNGE3MS1hNGRhLTMyY2VjYWUzYTk3OCIsImlzcyI6Imh0dHBzOi8vYWNjb3VudC1kLmRvY3VzaWduLmNvbS8iLCJzdWIiOiJiMWQ0NDgyOC0zN2MxLTQwMTgtYjM5ZS0yOGVkMDc1NWRlNGUiLCJhbXIiOlsiaW50ZXJhY3RpdmUiXSwiYXV0aF90aW1lIjoxNTY4ODg1OTgwLCJwd2lkIjoiOTUxNTY1ZjUtN2UwNS00ODg5LWEyYzItNGYzN2EwOWE0MDAyIn0.d7564bEl4qC_W2BFBKJUJ7aoVI4J1i_ln-xrSAnsxuNlC0qKtBGXHZCp6OcpmjVanp72K4vf-UUoCyLXZFmmqRh9h47A1KbshPW8yLsGTJYA1OZYIhNw80mwE0_9PlaY8sldnYTeHYU_XWin5CrbULCPLMuRMzJWgVMuCMCtkA1deEUNLxXnM_SlbR-RzAoDDWRpuuaeno21WbInhgCwAYzKwjx888bY4L9uU10jmUO9oeH7I-xUJLcuRrLq1uu9jdSf71dXjuRqBG3aVUveaYPuSiHv5AXYs2Z7PxPv5TrpLdLdqSDdVnA-mK0adry4cbmseXrOSZd2H4ze4LNLkA';
  const accountId = process.env.ACCOUNT_ID || req.query.ACCOUNT_ID || '9012031';
  const signerName = process.env.USER_FULLNAME || req.query.USER_FULLNAME || 'Fabricio Q';
  const signerEmail = process.env.USER_EMAIL || req.query.USER_EMAIL || 'fmquaglia@icloud.com';
  const fileName = 'test.pdf';
  const client = new docusign.ApiClient();

  client.setBasePath(basePath);
  client.addDefaultHeader('Authorization', 'Bearer ' + accessToken);
  docusign.Configuration.default.setDefaultApiClient(client);

  // envelope
  const envelopeDefinition = new docusign.EnvelopeDefinition();
  envelopeDefinition.emailSubject = 'Please sign this document sent from the Node example';
  envelopeDefinition.emailBlurb = 'Please sign this document sent from the Node example.';

  // doc
  const buffer = fs.readFileSync(path.resolve(__dirname, fileName));
  const base64 = buffer.toString('base64');
  const doc = docusign.Document.constructFromObject({
    documentBase64: base64,
    fileExtension: 'pdf',
    name: 'Sample document',
    documentId: '1'
  });
  envelopeDefinition.documents = [doc];

  // signer
  const signer = docusign.Signer.constructFromObject({
    name: signerName,
    email: signerEmail,
    routingOrder: '1',
    recipientId: '1'
  });

  // signHere tab
  const signHere = docusign.SignHere.constructFromObject({
    documentId: '1',
    pageNumber: '1',
    recipientId: '1',
    tabLabel: 'SignHereTab',
    xPosition: '195',
    yPosition: '147'
  });

  signer.tabs = docusign.Tabs.constructFromObject({signHereTabs: [signHere]});
  envelopeDefinition.recipients = docusign.Recipients.constructFromObject({signers: [signer]});
  envelopeDefinition.status = 'sent'; // drafts use 'created' | send immediately use 'sent'

  const envelopesApi = new docusign.EnvelopesApi();
  let results;

  try {
    results = await envelopesApi.createEnvelope(
      accountId,
      {'envelopeDefinition': envelopeDefinition}
    );
  } catch  (e) {
    const body = e.response && e.response.body;
    if (body) {
      // DocuSign API exception
      res.send (`<html lang="en"><body>
                  <h3>API problem</h3><p>Status code ${e.response.status}</p>
                  <p>Error message:</p><p><pre><code>${JSON.stringify(body, null, 4)}</code></pre></p>`);
    } else {
      throw e;
    }
  }
  if (results) {
    res.send (`<html lang="en"><body>
                <h3>Envelope Created!</h3>
                <p>Signer: ${signerName} &lt;${signerEmail}&gt;</p>
                <p>Results</p><p><pre><code>${JSON.stringify(results, null, 4)}</code></pre></p>`);
  }
};

express().get('/', sendEnvelopeController).listen(port, host);
console.log(`Your server is running on ${host}:${port}`);

