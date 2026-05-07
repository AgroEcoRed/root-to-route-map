import { motion } from "framer-motion";

interface AnimatedLogoProps {
  size?: number;
  className?: string;
}

/**
 * AgroEco.Red animated logo
 * - Network nodes orbit around a central sprouting leaf
 * - Connecting lines pulse to suggest a living network
 */
const AnimatedLogo = ({ size = 40, className = "" }: AnimatedLogoProps) => {
  const nodes = [
    { cx: 32, cy: 6 },
    { cx: 54, cy: 20 },
    { cx: 54, cy: 44 },
    { cx: 32, cy: 58 },
    { cx: 10, cy: 44 },
    { cx: 10, cy: 20 },
  ];

  return (
    <motion.svg
      width={size}
      height={size}
      viewBox="0 0 64 64"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      initial={{ rotate: 0 }}
      animate={{ rotate: 360 }}
      transition={{ duration: 40, repeat: Infinity, ease: "linear" }}
      aria-label="AgroEco.Red logo"
    >
      {/* Connecting lines (network) */}
      {nodes.map((n, i) => (
        <motion.line
          key={`l-${i}`}
          x1="32"
          y1="32"
          x2={n.cx}
          y2={n.cy}
          stroke="hsl(152 45% 38%)"
          strokeWidth="1.2"
          strokeLinecap="round"
          initial={{ pathLength: 0, opacity: 0.2 }}
          animate={{ pathLength: 1, opacity: [0.25, 0.7, 0.25] }}
          transition={{
            pathLength: { duration: 1.2, delay: i * 0.1 },
            opacity: { duration: 3, repeat: Infinity, delay: i * 0.3 },
          }}
        />
      ))}

      {/* Outer nodes */}
      {nodes.map((n, i) => (
        <motion.circle
          key={`n-${i}`}
          cx={n.cx}
          cy={n.cy}
          r="3.2"
          fill="hsl(45 80% 55%)"
          initial={{ scale: 0 }}
          animate={{ scale: [0.85, 1.1, 0.85] }}
          transition={{
            duration: 2.4,
            repeat: Infinity,
            delay: i * 0.25,
            ease: "easeInOut",
          }}
          style={{ transformOrigin: `${n.cx}px ${n.cy}px` }}
        />
      ))}

      {/* Central leaf — counter-rotates so it stays upright */}
      <motion.g
        animate={{ rotate: -360 }}
        transition={{ duration: 40, repeat: Infinity, ease: "linear" }}
        style={{ transformOrigin: "32px 32px" }}
      >
        <motion.path
          d="M32 20 C 22 26, 22 38, 32 44 C 42 38, 42 26, 32 20 Z"
          fill="hsl(152 45% 28%)"
          initial={{ scale: 0.9 }}
          animate={{ scale: [0.95, 1.05, 0.95] }}
          transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
          style={{ transformOrigin: "32px 32px" }}
        />
        <path
          d="M32 22 L32 42"
          stroke="hsl(45 80% 70%)"
          strokeWidth="1"
          strokeLinecap="round"
        />
      </motion.g>
    </motion.svg>
  );
};

export default AnimatedLogo;