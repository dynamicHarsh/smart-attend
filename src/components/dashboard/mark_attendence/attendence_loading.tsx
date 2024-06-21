'use client';
import { motion } from 'framer-motion';

export default function LoadingComponent() {
  return (
    <div className="flex items-center justify-center w-full h-full min-h-[50vh]">
      <motion.div
        className="bg-white p-8 rounded-xl shadow-lg text-center max-w-md w-full"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <motion.div
          className="text-6xl mb-4 inline-block"
          animate={{ rotate: 360 }}
          transition={{ duration: 2, loop: Infinity, ease: "linear" }}
        >
          ⏳
        </motion.div>
        <h1 className="text-2xl font-bold mb-2 text-gray-800">Marking Attendance...</h1>
        <p className="text-gray-600 text-sm">Please wait while we process your request.</p>
        <motion.div 
          className="mt-4 h-1 bg-blue-200 rounded-full overflow-hidden"
          initial={{ width: 0 }}
          animate={{ width: "100%" }}
          transition={{ duration: 2, repeat: Infinity }}
        >
          <div className="h-full bg-blue-500 rounded-full"></div>
        </motion.div>
      </motion.div>
    </div>
  );
}