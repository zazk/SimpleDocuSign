const docusign = require('docusign-esign');
const path = require('path');
const fs = require('fs');
const basePath = 'https://demo.docusign.net/restapi';
const express = require('express');
const port = process.env.PORT || 3000;
const host = process.env.HOST || 'localhost';
let baseUrl = process.env.BASE_URL || '{BASE_URL}';

const startSigningController = async(req, res) => {
  // https://developers.docusign.com/oauth-token-generator
  const accessToken = process.env.ACCESS_TOKEN || req.query.ACCESS_TOKEN || 'eyJ0eXAiOiJKV1QiLCJhbGciOiJSUzI1NiIsImtpZCI6IjY4MTg1ZmYxLTRlNTEtNGNlOS1hZjFjLTY4OTgxMjIwMzMxNyJ9.eyJUb2tlblR5cGUiOjUsIklzc3VlSW5zdGFudCI6MTU2ODg1MDk4MCwiZXhwIjoxNTY4ODc5NzgwLCJVc2VySWQiOiJiMWQ0NDgyOC0zN2MxLTQwMTgtYjM5ZS0yOGVkMDc1NWRlNGUiLCJzaXRlaWQiOjEsInNjcCI6WyJzaWduYXR1cmUiLCJjbGljay5tYW5hZ2UiLCJvcmdhbml6YXRpb25fcmVhZCIsImdyb3VwX3JlYWQiLCJwZXJtaXNzaW9uX3JlYWQiLCJ1c2VyX3JlYWQiLCJ1c2VyX3dyaXRlIiwiYWNjb3VudF9yZWFkIiwiZG9tYWluX3JlYWQiLCJpZGVudGl0eV9wcm92aWRlcl9yZWFkIiwiZHRyLnJvb21zLnJlYWQiLCJkdHIucm9vbXMud3JpdGUiLCJkdHIuZG9jdW1lbnRzLnJlYWQiLCJkdHIuZG9jdW1lbnRzLndyaXRlIiwiZHRyLnByb2ZpbGUucmVhZCIsImR0ci5wcm9maWxlLndyaXRlIiwiZHRyLmNvbXBhbnkucmVhZCIsImR0ci5jb21wYW55LndyaXRlIl0sImF1ZCI6ImYwZjI3ZjBlLTg1N2QtNGE3MS1hNGRhLTMyY2VjYWUzYTk3OCIsImlzcyI6Imh0dHBzOi8vYWNjb3VudC1kLmRvY3VzaWduLmNvbS8iLCJzdWIiOiJiMWQ0NDgyOC0zN2MxLTQwMTgtYjM5ZS0yOGVkMDc1NWRlNGUiLCJhbXIiOlsiaW50ZXJhY3RpdmUiXSwiYXV0aF90aW1lIjoxNTY4ODUwOTc4LCJwd2lkIjoiOTUxNTY1ZjUtN2UwNS00ODg5LWEyYzItNGYzN2EwOWE0MDAyIn0.wTRX-3KbmpuTzk-4hY_AEXdU2UcYwQo9hk_0vZRjwLghxs8-Nklr088lsm0Dw24XhnfnT5VU6mENba2zsqqn9yJq2SFEhSW0-SwpcAyfsWINXeJ4jRL0r1rEAT3HDlWWXqgpcB0P7iE0RguFWStczQexfNzwrfLB-agIPozEFzRd-Tnx_Gg7EQWerk-bs2xlIz9CU088p0DRpFD0z3jSK5-ek7AbNTks_j7OqsewTEQYsXc7PQjTH-kIpv0DTT8JIRucgvzz1S1ItRevUp7tmlvO64CsoS22KJQwb5IFvPZXIjUQf2oSbHFtv6fuwiwxtaFcZtS_yjYXkvsPFykMyQ';
  const accountId = process.env.ACCOUNT_ID || req.query.ACCOUNT_ID || '9012031';
  const signerName = process.env.USER_FULLNAME || req.query.USER_FULLNAME || 'Fabricio';
  const signerEmail = process.env.USER_EMAIL || req.query.USER_EMAIL || 'fabricio.quagliariello@whiteprompt.com';
  const clientUserId = '123';
  const authenticationMethod = 'None'; // https://developers.docusign.com/esign-rest-api/reference/Envelopes/EnvelopeViews/createRecipient
  const fileName = 'test.pdf';

  // envelope definition
  const envelopeDefinition = new docusign.EnvelopeDefinition();
  envelopeDefinition.emailSubject = 'Please sign this document sent from the Node example';
  envelopeDefinition.emailBlurb = 'Please sign this document sent from the Node example.';

  // document request object
  const buffer = fs.readFileSync(path.resolve(__dirname, fileName));
  const base64 = buffer.toString('base64');
  const document = docusign.Document.constructFromObject({
    documentBase64: base64,
    fileExtension:  'pdf',
    name:           'Sample document',
    documentId:     '1'
  });

  envelopeDefinition.documents = [document];

  // signer object
  const signer = docusign.Signer.constructFromObject({
    name:         signerName,
    email:        signerEmail,
    routingOrder: '1',
    recipientId:  '1',
    clientUserId: clientUserId
  });

  // signHere
  const signHere = docusign.SignHere.constructFromObject({
    documentId:  '1',
    pageNumber:  '1',
    recipientId: '1',
    tabLabel:    'SignHereTab',
    xPosition:   '195',
    yPosition:   '147'
  });

  signer.tabs = docusign.Tabs.constructFromObject({signHereTabs: [signHere]});
  envelopeDefinition.recipients = docusign.Recipients.constructFromObject({signers: [signer]});
  envelopeDefinition.status = 'sent'; // use created for drafts

  const client = new docusign.ApiClient();
  client.setBasePath(basePath);
  client.addDefaultHeader('Authorization', 'Bearer ' + accessToken);
  docusign.Configuration.default.setDefaultApiClient(client);
  let envelopesApi = new docusign.EnvelopesApi();
  let results;

  try {
    results = await envelopesApi.createEnvelope(accountId, {'envelopeDefinition': envelopeDefinition});
    const envelopeId = results.envelopeId;
    const recipientViewRequest = docusign.RecipientViewRequest.constructFromObject({
      authenticationMethod: authenticationMethod,
      clientUserId:         clientUserId,
      recipientId:          '1',
      returnUrl:            baseUrl + '/dsreturn',
      userName:             signerName,
      email:                signerEmail
    });

    results = await envelopesApi.createRecipientView(
      accountId,
      envelopeId,
      {recipientViewRequest: recipientViewRequest}
    );
    res.redirect(results.url)
  } catch (e) {
    let body = e.response && e.response.body;
    if (body) {
      // DocuSign API exception
      res.send(`<html lang="en"><body>
                  <h3>API problem</h3><p>Status code ${e.response.status}</p>
                  <p>Error message:</p><p><pre><code>${JSON.stringify(body, null, 4)}</code></pre></p>`);
    } else {
      // Not a DocuSign exception
      throw e;
    }
  }
};

const indexController = (req, res) => {
  res.send(`<html lang="en"><body><form action="${req.url}" method="post">
        <input type="submit" value="Sign the document!"
         style="width:13em;height:2em;background:#1f32bb;color:white;font:bold 1.5em arial;margin: 3em;"/>
        </form></body>`)
};

const signCallbackController = (req, res) => {
  res.send(`<html lang="en"><body><p>The signing ceremony was completed with
        status ${req.query.event}</p><p>This page can also implement post-signing processing.</p></body>`)
};

express()
  .get('/', indexController)
  .post('/', startSigningController)
  .get('/dsreturn', signCallbackController)
  .listen(port);

if (baseUrl === '{BASE_URL}') {
  baseUrl = `http://${host}:${port}`;
}

console.log(`Your server is running on ${host}:${port}`);
console.log(`baseUrl set to ${baseUrl}`);
