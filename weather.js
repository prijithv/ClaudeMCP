import { z } from "zod";

/**
 * Weather Tools
 * ──────────────
 * Uses the FREE Open-Meteo API — no API key required!
 * https://open-meteo.com/
 */

const WMO_CODES = {
  0: "☀️ Clear sky",
  1: "🌤 Mainly clear", 2: "⛅ Partly cloudy", 3: "☁️ Overcast",
  45: "🌫 Fog", 48: "🌫 Icy fog",
  51: "🌦 Light drizzle", 53: "🌦 Moderate drizzle", 55: "🌧 Dense drizzle",
  61: "🌧 Slight rain", 63: "🌧 Moderate rain", 65: "🌧 Heavy rain",
  71: "🌨 Slight snow", 73: "❄️ Moderate snow", 75: "❄️ Heavy snow",
  80: "🌦 Slight showers", 81: "🌧 Moderate showers", 82: "⛈ Violent showers",
  95: "⛈ Thunderstorm", 96: "⛈ Thunderstorm w/ hail", 99: "⛈ Severe thunderstorm",
};

async function geocode(city) {
  const url = `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(city)}&count=1&language=en&format=json`;
  const res  = await fetch(url);
  const data = await res.json();
  if (!data.results?.length) throw new Error(`City not found: "${city}"`);
  return data.results[0];
}

export function registerWeatherTools(server) {
  server.tool(
    "get_weather",
    "Get the current weather for any city in the world. Uses the free Open-Meteo API — no API key needed.",
    {
      city: z.string().min(1).describe('City name, e.g. "London", "Tokyo", "New York"'),
      units: z
        .enum(["celsius", "fahrenheit"])
        .default("celsius")
        .describe("Temperature unit"),
    },
    { readOnlyHint: true },
    async ({ city, units }) => {
      try {
        const loc = await geocode(city);
        const tempUnit = units === "fahrenheit" ? "fahrenheit" : "celsius";
        const symbol   = units === "fahrenheit" ? "°F" : "°C";

        const url = `https://api.open-meteo.com/v1/forecast?latitude=${loc.latitude}&longitude=${loc.longitude}&current=temperature_2m,apparent_temperature,relative_humidity_2m,wind_speed_10m,wind_direction_10m,weathercode&temperature_unit=${tempUnit}&wind_speed_unit=kmh`;
        const res  = await fetch(url);
        const data = await res.json();
        const c    = data.current;

        const condition = WMO_CODES[c.weathercode] ?? `Code ${c.weathercode}`;
        const windDir   = ["N","NE","E","SE","S","SW","W","NW"][Math.round(c.wind_direction_10m / 45) % 8];

        return {
          content: [
            {
              type: "text",
              text: [
                `🌍 Weather in ${loc.name}, ${loc.country}`,
                `──────────────────────────────`,
                `Condition:    ${condition}`,
                `Temperature:  ${c.temperature_2m}${symbol} (feels like ${c.apparent_temperature}${symbol})`,
                `Humidity:     ${c.relative_humidity_2m}%`,
                `Wind:         ${c.wind_speed_10m} km/h ${windDir}`,
              ].join("\n"),
            },
          ],
        };
      } catch (err) {
        return {
          content: [{ type: "text", text: `Error: ${err.message}` }],
          isError: true,
        };
      }
    }
  );

  server.tool(
    "get_forecast",
    "Get a 7-day weather forecast for any city. Uses the free Open-Meteo API.",
    {
      city: z.string().min(1).describe("City name"),
      units: z.enum(["celsius", "fahrenheit"]).default("celsius"),
    },
    { readOnlyHint: true },
    async ({ city, units }) => {
      try {
        const loc = await geocode(city);
        const tempUnit = units === "fahrenheit" ? "fahrenheit" : "celsius";
        const symbol   = units === "fahrenheit" ? "°F" : "°C";

        const url = `https://api.open-meteo.com/v1/forecast?latitude=${loc.latitude}&longitude=${loc.longitude}&daily=weathercode,temperature_2m_max,temperature_2m_min,precipitation_sum&temperature_unit=${tempUnit}&timezone=auto`;
        const res  = await fetch(url);
        const data = await res.json();
        const d    = data.daily;

        const days = d.time.map((date, i) => {
          const cond = WMO_CODES[d.weathercode[i]] ?? `Code ${d.weathercode[i]}`;
          return `${date}  ${cond}  ${d.temperature_2m_min[i]}–${d.temperature_2m_max[i]}${symbol}  💧${d.precipitation_sum[i]}mm`;
        });

        return {
          content: [
            {
              type: "text",
              text: [`📅 7-Day Forecast for ${loc.name}, ${loc.country}`, `${"─".repeat(60)}`, ...days].join("\n"),
            },
          ],
        };
      } catch (err) {
        return { content: [{ type: "text", text: `Error: ${err.message}` }], isError: true };
      }
    }
  );
}
