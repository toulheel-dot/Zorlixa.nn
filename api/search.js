export default async function handler(request, response) {
  const startTime = Date.now();

  const mobile = request.query.mobile;
  const aadhar = request.query.aadhar;
  const apikey = request.query.key;

  // 🔑 Key check
  if (!apikey) {
    return response.status(401).json({ 
      message: "Provide correct key",
      contact: "@dmforbans"
    });
  }

  // 🔑 Valid Keys
  // 📅 Expiry: 4 November 2026
  const VALID_KEYS = {
    "X7R9M4K2P8QZ": { expires: 1793750400000 }
  };

  const keyInfo = VALID_KEYS[apikey];

  if (!keyInfo) {
    return response.status(403).json({ 
      message: "Provide correct key",
      contact: "@dmforbans"
    });
  }

  // ⏰ Expire check
  const now = Date.now();
  if (now > keyInfo.expires) {
    const expiryDate = new Date(keyInfo.expires).toISOString().split("T")[0];
    return response.status(403).json({ 
      message: "Your API key expired",
      expired_on: expiryDate,
      contact: "@dmforbans"
    });
  }

  const expiryDate = new Date(keyInfo.expires).toISOString().split("T")[0];

  // 🧠 कौन सा parameter आया?
  let type = "";
  let term = "";

  if (mobile) {
    // 📞 Number — सिर्फ 10 digit
    if (!/^\d{10}$/.test(mobile)) {
      return response.status(400).json({ 
        message: "Provide valid 10 digit mobile number",
        contact: "@dmforbans"
      });
    }
    type = "number";
    term = mobile;

  } else if (aadhar) {
    // 🪪 Aadhar — सिर्फ 12 digit
    if (!/^\d{12}$/.test(aadhar)) {
      return response.status(400).json({ 
        message: "Provide valid 12 digit aadhar number",
        contact: "@dmforbans"
      });
    }
    type = "aadhar";
    term = aadhar;

  } else {
    return response.status(400).json({ 
      message: "Provide mobile or aadhar parameter",
      contact: "@dmforbans"
    });
  }

  // 🌐 HF API call (hidden)
  const hfUrl = `https://hiteckgroup-hiteckgroupp.hf.space/search?q=${encodeURIComponent(term)}&key=638663LLKK`;

  try {
    const hfResponse = await fetch(hfUrl);

    const responseTimeMs = Date.now() - startTime;
    const responseTimeSec = (responseTimeMs / 1000).toFixed(3);

    if (!hfResponse.ok) {
      return response.status(404).json({ 
        query: term,
        type: type,
        response_time_ms: responseTimeMs,
        response_time: responseTimeSec + "s",
        key_expires_on: expiryDate,
        developer: "@dmforbans",
        data: null,
        message: "Data not found"
      });
    }

    let data = await hfResponse.json();
    data = removeCredits(data);

    if (!data || data.count === 0 || !data.results || data.results.length === 0) {
      return response.status(404).json({ 
        query: term,
        type: type,
        response_time_ms: responseTimeMs,
        response_time: responseTimeSec + "s",
        key_expires_on: expiryDate,
        developer: "@dmforbans",
        data: null,
        message: "Data not found"
      });
    }

    return response.status(200).json({
      query: term,
      type: type,
      response_time_ms: responseTimeMs,
      response_time: responseTimeSec + "s",
      key_expires_on: expiryDate,
      developer: "@dmforbans",
      data: data
    });

  } catch (error) {
    const responseTimeMs = Date.now() - startTime;
    const responseTimeSec = (responseTimeMs / 1000).toFixed(3);

    return response.status(500).json({ 
      query: term,
      type: type,
      response_time_ms: responseTimeMs,
      response_time: responseTimeSec + "s",
      key_expires_on: expiryDate,
      developer: "@dmforbans",
      data: null,
      message: "Data not found"
    });
  }
}

// 🧹 Credit हटाने का function
function removeCredits(obj) {
  if (!obj || typeof obj !== "object") return obj;
  if (Array.isArray(obj)) return obj.map(item => removeCredits(item));

  const cleaned = {};
  for (const key in obj) {
    const lowerKey = key.toLowerCase();

    if (
      lowerKey === "credit" || lowerKey === "credits" ||
      lowerKey === "developer" || lowerKey === "developed_by" ||
      lowerKey === "author" || lowerKey === "created_by" ||
      lowerKey === "powered_by" || lowerKey === "source" ||
      lowerKey === "hiteckgroup" || lowerKey === "hiteck"
    ) {
      continue;
    }

    if (typeof obj[key] === "string") {
      const valueLower = obj[key].toLowerCase();
      if (
        valueLower.includes("hiteckgroup") ||
        valueLower.includes("hiteck") ||
        valueLower.includes("t.me/") ||
        valueLower.includes("telegram")
      ) {
        continue;
      }
    }

    cleaned[key] = removeCredits(obj[key]);
  }
  return cleaned;
}
