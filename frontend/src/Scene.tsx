import { useId } from "react";
/** Original procedural illustration. Not a photograph of the named park. */
export function Scene({
  kind = "forest",
  hero = false,
}: {
  kind?: string;
  hero?: boolean;
}) {
  const id = useId().replace(/:/g, "");
  const water = kind === "coast" || kind === "wetland";
  return (
    <svg
      className={`scene ${hero ? "hero-scene" : ""}`}
      viewBox="0 0 700 380"
      preserveAspectRatio="xMidYMid slice"
      role="img"
      aria-label={`Original ${kind} landscape illustration`}
    >
      <defs>
        <linearGradient id={id + "sky"} x2="0" y2="1">
          <stop stopColor="#d7ded0" />
          <stop offset="1" stopColor="#f5e7bc" />
        </linearGradient>
        <linearGradient id={id + "land"} x2="0" y2="1">
          <stop stopColor="#547961" />
          <stop offset="1" stopColor="#1e4639" />
        </linearGradient>
        <linearGradient id={id + "water"} x2="1" y2="1">
          <stop stopColor="#86aaa3" />
          <stop offset="1" stopColor="#c4d4be" />
        </linearGradient>
      </defs>
      <rect width="700" height="380" fill={`url(#${id}sky)`} />
      <circle cx={water ? 490 : 425} cy="102" r="47" fill="#f6e9ba" />
      <path d="M0 190Q100 78 220 170T440 151T700 140V380H0Z" fill="#a1b7a0" />
      <path d="M0 234Q160 129 310 218T700 188V380H0Z" fill="#73967b" />
      {water ? (
        <>
          <path
            d="M0 242Q160 217 370 229T700 220V380H0Z"
            fill={`url(#${id}water)`}
          />
          <path
            d="M0 277Q158 223 290 265L208 280Q370 296 289 380H0Z"
            fill="#466b52"
          />
          <path
            d="M450 270h119m-60 20h126m-170 30h95m25 20h89"
            stroke="#e2e8cf"
            strokeWidth="3"
            opacity=".55"
          />
        </>
      ) : (
        <>
          <path
            d="M0 295Q191 208 354 250T700 232V380H0Z"
            fill={`url(#${id}land)`}
          />
          <path
            d="M405 232Q324 260 381 287T313 380H450Q486 329 419 297T432 234Z"
            fill="#d9c794"
          />
        </>
      )}
      {Array.from({ length: hero ? 23 : 15 }, (_, i) => {
        const x = ((i * 67 + 19) % 730) - 20;
        const y = 217 + (i % 4) * 29;
        const h = 65 + ((i * 37) % 105);
        return (
          <g key={i} opacity={i % 3 === 0 ? 0.72 : 1}>
            <path
              d={`M${x} ${y + 42}v-${h}`}
              stroke="#354d3e"
              strokeWidth="4"
            />
            {kind === "meadow" ? (
              <ellipse
                cx={x}
                cy={y - h / 2}
                rx={24 + (i % 8)}
                ry={h / 2}
                fill={["#5c7952", "#8c995d", "#3e654c"][i % 3]}
              />
            ) : (
              <path
                d={`M${x} ${y - h}l-${h / 3} ${h * 0.72}h${h * 0.16}l-${h * 0.26} ${h * 0.35}h${h * 0.86}l-${h * 0.26}-${h * 0.35}h${h * 0.16}Z`}
                fill={["#244d3f", "#456a50", "#68876a"][i % 3]}
              />
            )}
          </g>
        );
      })}
      <path
        d="M0 359Q134 315 247 365T700 350V380H0Z"
        fill="#183b32"
        opacity=".8"
      />
      {kind === "wetland" && (
        <path
          d="m540 360 9-58m-9 43-17-24m23 8 18-27m-1 58 13-63"
          stroke="#526e43"
          strokeWidth="4"
        />
      )}
      <g fill="none" stroke="#486b58" strokeWidth="2">
        <path d="M529 90q8-9 16 0 8-9 16 0m-58 29q6-7 12 0 6-7 12 0" />
      </g>
    </svg>
  );
}
