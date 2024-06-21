'use client';
import { motion } from 'framer-motion';
import { useRouter } from 'next/navigation';

export default function ErrorComponent({ message }: { message: string }) {
  const router = useRouter();

  return (
    <div className="flex items-center justify-center w-full h-full min-h-[50vh]">
      <motion.div
        className="bg-white p-8 rounded-xl shadow-lg text-center max-w-md w-full"
        initial={{ opacity: 0, scale: 1.1 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5 }}
      >
        <motion.div
          className="text-6xl mb-4 inline-block"
          animate={{ 
            rotate: [0, 10, -10, 10, 0],
            scale: [1, 1.1, 1, 1.1, 1],
          }}
          transition={{ duration: 0.5, loop: 2 }}
        >
          ❌
        </motion.div>
        <h1 className="text-2xl font-bold mb-2 text-gray-800">Oops! An Error Occurred</h1>
        <p className="text-gray-600 text-sm mb-4">{message}</p>
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => router.push('/dashboard/student')}
          className="px-4 py-2 bg-gradient-to-r from-red-400 to-orange-500 text-white rounded-full font-semibold text-sm hover:from-red-500 hover:to-orange-600 transition-colors duration-300 shadow-md"
        >
          Back to Dashboard
        </motion.button>
      </motion.div>
    </div>
  );
}