async function test() {
  const apiKey = 'AIzaSyAkpxHpgTuEJB0esz8V3GbvIuV5koNo40Q';
  const base64Data = 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAACklEQVR4nGMAAQAABQABDQottAAAAABJRU5ErkJggg==';
  
  try {
    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-flash-latest:generateContent?key=${apiKey}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        contents: [{
          parts: [
            {
              text: "You are a nutrition expert. Given an image of food or a barcode, identify it and estimate its nutritional values per standard serving. Reply ONLY with a raw JSON object containing these keys: name (string), emoji (string), cal (number, calories), protein (number, grams), carbs (number, grams), fats (number, grams), serving (string, e.g. '1 plate' or '1 can'), category (string)."
            },
            {
              inlineData: {
                mimeType: 'image/png',
                data: base64Data
              }
            }
          ]
        }],
        generationConfig: {
          responseMimeType: "application/json"
        }
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("API error:", response.status, errorText);
      return;
    }

    const data = await response.json();
    console.log(JSON.stringify(data, null, 2));
  } catch (e) {
    console.error(e);
  }
}
test();
