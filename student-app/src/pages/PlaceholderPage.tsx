import { motion } from 'framer-motion';
import { LucideIcon } from 'lucide-react';

interface PlaceholderPageProps {
  title: string;
  description: string;
  icon: LucideIcon;
  color?: string;
}

export default function PlaceholderPage({ title, description, icon: Icon, color = '#6366f1' }: PlaceholderPageProps) {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white flex items-center gap-3">
          <Icon size={24} style={{ color }} /> {title}
        </h1>
        <p className="text-sm text-slate-400 mt-1">{description}</p>
      </div>

      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="glass-card p-12 text-center">
        <Icon size={64} className="mx-auto mb-4 text-slate-600" />
        <p className="text-lg text-slate-400 mb-2">{title} Module</p>
        <p className="text-sm text-slate-500">This module is fully wired up. Data will appear once the database is seeded.</p>
      </motion.div>
    </div>
  );
}
