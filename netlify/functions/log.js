// ─── Netlify Function: HerbieLog Proxy ───────────────
// Receives log payload from the HTML and writes to the Azure HerbieLog function
// server-side. Keeps HERBIE_FUNCTION_KEY out of the browser entirely.
//
// Set HERBIE_FUNCTION_KEY as a Netlify environment variable:
// Netlify dashboard → Site → Environment variables → Add variable
//
// The HTML calls POST /api/log instead of Azure directly.

exports.handler = async function(event) {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Method Not Allowed' };
  }

  const functionKey = process.env.HERBIE_FUNCTION_KEY;
  if (!functionKey) {
    return {
      statusCode: 500,
      body: JSON.stringify({ error: 'HERBIE_FUNCTION_KEY environment variable not set' })
    };
  }

  let body;
  try {
    body = JSON.parse(event.body);
  } catch(e) {
    return { statusCode: 400, body: JSON.stringify({ error: 'Invalid JSON body' }) };
  }

  try {
    const response = await fetch(
      'https://sbr-herbie-functions-c3cdccc7c5a9dyay.centralus-01.azurewebsites.net/api/HerbieLog',
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-functions-key': functionKey
        },
        body: JSON.stringify(body)
      }
    );

    const text = await response.text();

    return {
      statusCode: response.status,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      },
      body: text
    };
  } catch(e) {
    return {
      statusCode: 500,
      body: JSON.stringify({ error: e.message })
    };
  }
};
