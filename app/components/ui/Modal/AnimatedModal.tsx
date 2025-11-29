'use client';

import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useReducedMotion } from '@/app/lib/hooks';
import { fadeVariants, scaleVariants, transitions } from '@/app/lib/animations';
import styles from './Modal.module.css';

interface AnimatedModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  description?: string;
  wide?: boolean;
  children: React.ReactNode;
}

export const AnimatedModal: React.FC<AnimatedModalProps> = ({
  isOpen,
  onClose,
  title,
  description,
  wide,
  children,
}) => {
  const prefersReducedMotion = useReducedMotion();
  const contentVariant = prefersReducedMotion ? fadeVariants : scaleVariants;

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            className={styles.overlay}
            variants={fadeVariants}
            initial="initial"
            animate="animate"
            exit="exit"
            transition={transitions.normal}
            onClick={onClose}
            role="presentation"
          />

          {/* Modal Content */}
          <motion.div
            className={`${styles.modal} ${wide ? styles.modalWide : ''}`}
            variants={contentVariant}
            initial="initial"
            animate="animate"
            exit="exit"
            transition={transitions.slow}
            onClick={(e) => e.stopPropagation()}
            role="dialog"
            aria-modal="true"
            aria-labelledby="modal-title"
          >
            <div className={styles.header}>
              <h2 className={styles.title} id="modal-title">
                {title}
              </h2>
              <button
                className={styles.closeButton}
                onClick={onClose}
                aria-label="Close modal"
                type="button"
              >
                ×
              </button>
            </div>
            {description && <p className={styles.description}>{description}</p>}
            {children}
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

export default AnimatedModal;
