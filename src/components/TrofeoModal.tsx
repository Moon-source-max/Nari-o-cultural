import { motion, AnimatePresence } from 'motion/react';
import type { Trofeo } from '../lib/pasaporte';

interface Props {
  trofeo: Trofeo | null;
  onClose: () => void;
}

export function TrofeoModal({ trofeo, onClose }: Props) {
  return (
    <AnimatePresence>
      {trofeo && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50"
        >
          <motion.div
            initial={{ scale: 0.5, opacity: 0, y: 60 }}
            animate={{ scale: 1,   opacity: 1, y: 0 }}
            exit={{   scale: 0.8,  opacity: 0, y: -40 }}
            transition={{ type: 'spring', stiffness: 300, damping: 20 }}
            onClick={e => e.stopPropagation()}
            className="bg-white rounded-2xl p-8 text-center shadow-2xl max-w-xs mx-4"
          >
            <motion.div
              animate={{ rotate: [0, -10, 10, -10, 10, 0], scale: [1, 1.2, 1] }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="text-7xl mb-4"
            >
              {trofeo.icono}
            </motion.div>
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
            >
              <p className="text-sm text-gray-500 mb-1">¡Trofeo desbloqueado!</p>
              <h2 className="text-xl font-semibold text-gray-900 mb-2">{trofeo.nombre}</h2>
              <p className="text-gray-500 text-sm mb-4">{trofeo.descripcion}</p>
              <span className="inline-block bg-blue-100 text-blue-700 text-sm px-3 py-1 rounded-full font-medium">
                +{trofeo.xp} XP
              </span>
            </motion.div>
            <motion.button
              whileTap={{ scale: 0.95 }}
              onClick={onClose}
              className="mt-6 w-full py-2 rounded-xl border border-gray-200 text-sm text-gray-600 hover:bg-gray-50"
            >
              ¡Genial!
            </motion.button>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
