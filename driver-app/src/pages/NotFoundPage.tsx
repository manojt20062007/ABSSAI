import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Bus, Home, ArrowLeft } from 'lucide-react';

export default function NotFoundPage() {
  return (
    <div className="min-h-screen flex items-center justify-center animated-gradient p-8">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="text-center">
        <motion.div
          animate={{ y: [0, -10, 0] }}
          transition={{ duration: 2, repeat: Infinity }}
          className="mb-8"
        >
          <Bus size={80} className="mx-auto text-indigo-400" />
        </motion.div>
        <h1 className="text-7xl font-bold bg-gradient-to-r from-indigo-400 to-cyan-400 bg-clip-text text-transparent mb-4">404</h1>
        <p className="text-xl text-slate-300 mb-2">Route Not Found</p>
        <p className="text-slate-500 mb-8">The page you're looking for has been rerouted or doesn't exist.</p>
        <div className="flex gap-4 justify-center">
          <Link to="/dashboard" className="btn-primary"><Home size={16} /> Dashboard</Link>
          <button onClick={() => window.history.back()} className="btn-secondary"><ArrowLeft size={16} /> Go Back</button>
        </div>
      </motion.div>
    </div>
  );
}
