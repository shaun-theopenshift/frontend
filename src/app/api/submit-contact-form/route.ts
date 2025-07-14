// src/app/api/submit-contact-form/route.ts
import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  const WEB3FORMS_ACCESS_KEY = process.env.WEB3FORMS_ACCESS_KEY;

  if (!WEB3FORMS_ACCESS_KEY) {
    console.error("WEB3FORMS_ACCESS_KEY is not set in environment variables.");
    return NextResponse.json({ success: false, message: "Server configuration error: Missing API key." }, { status: 500 });
  }

  try {
    const formData = await request.json();

    // Prepare data for Web3Forms, including the access_key
    const web3formsData = {
      access_key: WEB3FORMS_ACCESS_KEY,
      ...formData,
    };

    const response = await fetch("https://api.web3forms.com/submit", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Accept": "application/json",
      },
      body: JSON.stringify(web3formsData),
    });

    const result = await response.json();

    if (result.success) {
      return NextResponse.json({ success: true, message: "Message sent successfully!" });
    } else {
      console.error("Web3Forms API error:", result);
      return NextResponse.json({ success: false, message: result.message || "Failed to send message via Web3Forms." }, { status: response.status || 400 });
    }
  } catch (error) {
    console.error("Error processing form submission:", error);
    return NextResponse.json({ success: false, message: "An unexpected server error occurred." }, { status: 500 });
  }
}