import axios from "axios";

export async function GET(req: Request, { params }: { params: string | any }) {
  try {
    const { city } = params;
    const apiUrl = `https://api.api-ninjas.com/v1/airquality?city=${city}`;
    const data = await axios.get(apiUrl, {
      headers: { "X-Api-Key": process.env.TOKEN },
    });

    // const city = "bangalore";
    // const AQI_url = `https://api.waqi.info/feed/${city}/?token=${process.env
    //   .NEXT_PUBLIC_TOKEN!}`;
    // const data = await axios.get(AQI_url);
    // console.log(data);
    return Response.json(
      {
        success: true,
        message: "Successfully fetched the AQI.",
        data: data.data,
      },
      { status: 200 }
    );
  } catch (error) {
    console.log(error);
    return Response.json(
      { success: false, message: "Error while getting the aqi" },
      { status: 400 }
    );
  }
}
