"use client";

import {
  AnimatePresence,
  motion,
  useDragControls,
  useMotionValue,
  useScroll,
  useTransform,
} from "framer-motion";
import React, { useEffect, useMemo, useRef, useState } from "react";
import useMeasure from "react-use-measure";
import { cn } from "@/lib/utils";

const termsSections = [
  { title: "Agreement to Terms", id: "agreement" },
  { title: "Privacy Policy", id: "privacy" },
  { title: "Changes to Terms or Services", id: "changes" },
  { title: "Who May Use the Services", id: "eligibility" },
  { title: "Use of the Services", id: "use" },
  { title: "Assumption of Risk", id: "risk" },
  { title: "Feedback", id: "feedback" },
  { title: "Fees", id: "fees" },
  { title: "Third-Party Resources", id: "third-party" },
  { title: "General Prohibitions", id: "prohibitions" },
  { title: "Suspension and Termination", id: "termination" },
  { title: "Warranty Disclaimers", id: "warranties" },
  { title: "Indemnity", id: "indemnity" },
  { title: "Limitation of Liability", id: "liability" },
  { title: "Governing Law and Forum Choice", id: "governing-law" },
  { title: "General Terms", id: "general" },
  { title: "Severability", id: "dispute-resolution" },
  { title: "Dispute Resolution", id: "arbitration" },
  { title: "Contact Information", id: "contact" },
];

export const TermsScrollBar = ({
  activeSection,
  setActiveSection,
}: {
  activeSection: number;
  setActiveSection: (section: number) => void;
}) => {
  const { scrollYProgress } = useScroll();
  const [scrollBarWrapperRef, bounds] = useMeasure();
  const translateX = useTransform(
    scrollYProgress,
    [0, 1],
    [0, bounds.width - 1.5],
  );
  const [isDragging, setIsDragging] = useState(false);
  const [ghostPosition, setGhostPosition] = useState(0);
  const [isHovering, setIsHovering] = useState(false);
  const scrollBarRef = useRef(null);
  const dragControls = useDragControls();

  const handleX = useMotionValue(0);

  useEffect(() => {
    if (!isDragging) {
      const unsubscribe = translateX.on("change", (v) => handleX.set(v));
      return () => unsubscribe();
    }
  }, [isDragging, translateX, handleX]);

  const handleMouseMove = (e: React.MouseEvent) => {
    if (isDragging) {
      setGhostPosition(-20);
      return;
    }

    if (scrollBarRef.current) {
      const relativeX = Math.max(
        0,
        Math.min(e.clientX - bounds.left, bounds.width - 6),
      );
      setGhostPosition(relativeX);
    }
  };

  const handleScrollBarClick = (e: React.MouseEvent) => {
    if (!scrollBarRef.current || isDragging) return;

    const clickX = e.clientX - bounds.left;
    const barWidth = bounds.width;
    const relativePosition = Math.max(0, Math.min(1, clickX / barWidth));

    const scrollableHeight =
      document.documentElement.scrollHeight - window.innerHeight;

    window.scrollTo({
      top: scrollableHeight * relativePosition,
      behavior: "instant",
    });
  };

  const handleDrag = (
    event: MouseEvent,
    info: { point: { x: number; y: number } },
  ) => {
    event.preventDefault();
    if (!scrollBarRef.current) return;

    const barWidth = bounds.width;
    const dragX = Math.max(0, Math.min(info.point.x - bounds.left, barWidth));
    const relativePosition = dragX / barWidth;

    handleX.set(dragX);

    const scrollableHeight =
      document.documentElement.scrollHeight - window.innerHeight;

    window.scrollTo({
      top: scrollableHeight * relativePosition,
      behavior: "instant",
    });
  };

  const scrollbarBars = useMemo(
    () =>
      [...Array(40)].map((_, item) => (
        <motion.div
          key={item}
          initial={{
            opacity: item % 5 === 0 ? 0.2 : 0.2,
            filter: "blur(1px)",
          }}
          animate={{
            opacity: item % 5 === 0 ? 1 : 0.2,
            filter: "blur(0px)",
          }}
          transition={{
            duration: 0.2,
            delay: item % 5 === 0 ? (item / 5) * 0.05 : 0,
            ease: "easeOut",
          }}
          className={cn(
            "w-[1px] bg-white",
            item % 5 === 0 ? "h-[15px]" : "h-[15px]",
          )}
        />
      )),
    [],
  );

  return (
    <div className="fixed bottom-5 right-1/2 z-50 translate-x-1/2 flex-col overflow-hidden rounded-2xl sm:right-5 sm:translate-x-0">
      <AnimatePresence mode="popLayout">
        <motion.div
          initial={{ y: "100%", opacity: 0 }}
          animate={{ y: "0%", opacity: 1 }}
          exit={{ y: "100%", opacity: 0 }}
          transition={{ duration: 0.5, bounce: 0, type: "spring" }}
          key={activeSection}
        >
          <ScrollCard section={termsSections[activeSection]} />
        </motion.div>
      </AnimatePresence>
      <motion.div className="cursor-grab rounded-xl bg-[#1a1a1a] px-5 will-change-transform">
        <div ref={scrollBarWrapperRef}>
          <div
            className="relative flex h-[40px] items-center justify-center gap-1.5 overflow-hidden rounded-xl"
            ref={scrollBarRef}
            onClick={handleScrollBarClick}
            onMouseEnter={() => setIsHovering(true)}
            onMouseLeave={() => setIsHovering(false)}
            onMouseMove={handleMouseMove}
          >
            {scrollbarBars}

            <AnimatePresence mode="popLayout">
              {isHovering && !isDragging && (
                <motion.div
                  className="absolute h-[24px] w-1.5 cursor-grab rounded-full bg-[#22d3ee] opacity-30"
                  style={{
                    left: ghostPosition,
                    willChange: "transform",
                  }}
                  transition={{
                    type: "tween",
                    duration: 0,
                  }}
                />
              )}
            </AnimatePresence>
            <motion.div
              layout
              drag="x"
              dragControls={dragControls}
              dragConstraints={scrollBarRef}
              dragElastic={0}
              dragMomentum={false}
              onDragStart={() => setIsDragging(true)}
              onDrag={handleDrag}
              onDragEnd={() => setIsDragging(false)}
              className="absolute left-0 h-[24px] w-1.5 cursor-grab rounded-full bg-[#22d3ee] active:cursor-grabbing"
              style={{ x: handleX }}
            />
          </div>
        </div>
      </motion.div>
    </div>
  );
};

const ScrollCard = ({
  section,
}: {
  section: { title: string; id: string };
}) => {
  return (
    <div className="mb-2 flex w-full rounded-xl bg-[#1a1a1a] p-4">
      <div className="flex-1">
        <div className="mb-1 text-xs text-[#7b7b7b]">Current Section</div>
        <div className="text-sm font-medium text-white">{section.title}</div>
      </div>
    </div>
  );
};
