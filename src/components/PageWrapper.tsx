import React from "react";
import { motion } from "framer-motion";

interface PageWrapperProps {
  children: React.ReactNode;
}

const PageWrapper: React.FC<PageWrapperProps> = ({ children }) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -15 }}
      transition={{
        type: "spring",
        stiffness: 260,
        damping: 20,
        opacity: { duration: 0.2 },
      }}
      className="w-full flex justify-center"
    >
      {children}
    </motion.div>
  );
};

export default PageWrapper;
