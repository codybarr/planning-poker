import { useRef, useEffect } from "react";
import { gsap } from "gsap";
import { MotionPathPlugin } from "gsap/MotionPathPlugin";
gsap.registerPlugin(MotionPathPlugin);

const EMOJIS = ["🍕", "💭", "✏️", "✈️"];

const randomRange = (min: number, max: number) =>
  Math.random() * (max - min) + min;

export default function EmojiThrower() {
  const containerRef = useRef<HTMLDivElement>(null);
  const playersRef = useRef<HTMLDivElement[]>([]);

  useEffect(() => {
    // Initialize player refs
    const playerElements = document.querySelectorAll(".player");
    console.log({ playerElements });
    playersRef.current = Array.from(playerElements) as HTMLDivElement[];

    // Update player refs whenever component mounts
    const updatePlayerRefs = () => {
      const elements = document.querySelectorAll(".player");
      playersRef.current = Array.from(elements) as HTMLDivElement[];
    };

    // Update refs when window resizes
    window.addEventListener("resize", updatePlayerRefs);
    return () => window.removeEventListener("resize", updatePlayerRefs);
  }, []);

  const throwEmoji = (targetIndex: number, emoji: string) => {
    const fromLeft = Math.random() > 0.5;
    const container = document.body;
    const targetPlayer = playersRef.current[targetIndex];
    if (!container || !targetPlayer) return;

    const containerRect = container.getBoundingClientRect();
    const targetRect = targetPlayer.getBoundingClientRect();

    // Create emoji element
    const emojiEl = document.createElement("div");
    emojiEl.textContent = emoji;
    emojiEl.style.position = "absolute";
    emojiEl.style.left = "0px";
    emojiEl.style.top = "0px";
    emojiEl.style.fontSize = "2rem";
    emojiEl.style.pointerEvents = "none";
    container.appendChild(emojiEl);
    const emojiRect = emojiEl.getBoundingClientRect();

    const startX = fromLeft ? -50 : containerRect.width + 50; // offscreen to the left
    const startY = targetRect.top;
    const targetX = fromLeft
      ? targetRect.left - emojiRect.width
      : targetRect.left + targetRect.width;
    const targetY = targetRect.top;

    // debug target position
    // const line = document.createElement("div");
    // line.style.position = "absolute";
    // line.style.left = targetX + "px";
    // line.style.top = targetY + "px";
    // line.style.width = "2px";
    // line.style.height = "20px";
    // line.style.backgroundColor = "yellow";
    // line.style.pointerEvents = "none";
    // container.appendChild(line);

    gsap.set(emojiEl, { x: startX, y: startY });

    gsap.to(emojiEl, {
      duration: 1,
      ease: "power1.in",
      motionPath: {
        path: [
          { x: startX, y: startY },
          {
            x: (startX + targetX) / 2,
            y: startY - randomRange(50, 150),
          },
          { x: targetX, y: targetY },
        ],
        curviness: 1.25,
        autoRotate: true,
      },
      onComplete: () => {
        // bounce away from target
        gsap.to(emojiEl, {
          duration: randomRange(0.1, 0.5),
          ease: "power1.out",
          x: fromLeft ? targetX - 100 : targetX + 150,
          y: targetY,
          rotation: () => Math.random() * 360,
          onComplete: () => {
            emojiEl.remove(); // Clean up after animation
          },
        });
      },
    });
  };

  return (
    <div
      ref={containerRef}
      className="relative h-screen w-full overflow-hidden bg-gray-900"
    >
      {/* Players */}
      <div className="absolute top-1/3 flex w-full justify-center gap-8">
        {["Player 1", "Player 2", "Player 3"].map((name, index) => (
          <div key={index} className="relative flex flex-col items-center">
            <div className="player rounded-full bg-white/10 px-6 py-3 text-white">
              {name}
            </div>
            <div className="mt-4 flex gap-2">
              {EMOJIS.map((emoji) => (
                <button
                  key={emoji}
                  onClick={() => throwEmoji(index, emoji)}
                  className="rounded-full bg-white/10 p-2 transition-colors hover:bg-white/20"
                >
                  {emoji}
                </button>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
