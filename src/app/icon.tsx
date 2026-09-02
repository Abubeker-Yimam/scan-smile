import { ImageResponse } from "next/og";

export const size = {
  width: 32,
  height: 32,
};
export const contentType = "image/png";

export default function Icon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          backgroundColor: "#14100d",
          border: "2px solid #c79a3f",
          borderRadius: 6,
        }}
      >
        <div
          style={{
            width: 14,
            height: 14,
            backgroundColor: "#c79a3f",
            borderRadius: 2,
          }}
        />
      </div>
    ),
    {
      ...size,
    }
  );
}
