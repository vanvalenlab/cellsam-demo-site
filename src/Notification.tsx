import React, { Fragment, useEffect, useState } from "react";
import { Transition } from "@headlessui/react";

export interface NotificationProps {
  show: boolean;
  severity: "error" | "warning";
  text: string;
  autoClose?: boolean;
  autoCloseTime?: number;
  onClose?: () => void;
  className?: string;
  hideCloseButton?: boolean;
}

const Notification: React.FC<NotificationProps> = ({
  show,
  severity,
  text,
  onClose,
  autoClose = true,
  autoCloseTime = 3000,
  className = "",
  hideCloseButton = false,
}) => {
  const [isOpen, setIsOpen] = useState(show);

  useEffect(() => {
    setIsOpen(show);
  }, [show]);

  useEffect(() => {
    if (isOpen && autoClose) {
      const timer = setTimeout(() => setIsOpen(false), autoCloseTime);
      return () => clearTimeout(timer);
    }
  }, [isOpen, autoClose, autoCloseTime]);

  const getIcon = () => {
    return severity === "error" ? (
      <svg
        xmlns="http://www.w3.org/2000/svg"
        fill="none"
        viewBox="0 0 24 24"
        strokeWidth={1.5}
        stroke="currentColor"
        className="w-6 h-6"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M9.75 9.75l4.5 4.5m0-4.5l-4.5 4.5M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
        />
      </svg>
    ) : (
      <svg
        xmlns="http://www.w3.org/2000/svg"
        fill="none"
        viewBox="0 0 24 24"
        strokeWidth={1.5}
        stroke="currentColor"
        className="w-6 h-6"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z"
        />
      </svg>
    );
  };

  // Background color classes
  const bgColorClass = severity === "error" ? "bg-rose-50" : "bg-amber-50";
  const textColorClass =
    severity === "error" ? "text-rose-700" : "text-amber-700";
  const buttonBgColorClass =
    severity === "error" ? "bg-rose-50" : "bg-amber-50";
  const buttonTextColorClass =
    severity === "error" ? "text-rose-500" : "text-amber-500";
  const buttonHoverBgColorClass =
    severity === "error" ? "hover:bg-rose-100" : "hover:bg-amber-100";

  return (
    <Transition
      show={show}
      as={Fragment}
      enter="transform ease-out duration-300 transition"
      enterFrom="translate-y-2 opacity-0 sm:translate-y-0 sm:translate-x-2"
      enterTo="translate-y-0 opacity-100 sm:translate-x-0"
      leave="transition ease-in duration-100"
      leaveFrom="opacity-100"
      leaveTo="opacity-0"
    >
      <div className={`rounded-md p-4 ${className} ${bgColorClass}`}>
        <div className="flex items-center">
          <div className="flex-shrink-0">{getIcon()}</div>
          <div className="ml-3">
            <p className={`text-sm font-medium ${textColorClass}`}>{text}</p>
          </div>
          {!hideCloseButton && (
            <div className="ml-auto pl-3">
              <button
                type="button"
                className={`inline-flex rounded-md ${buttonBgColorClass} p-1.5 ${buttonTextColorClass} ${buttonHoverBgColorClass} focus:outline-none`}
                onClick={onClose}
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                  strokeWidth={1.5}
                  stroke="currentColor"
                  className="w-6 h-6"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>
            </div>
          )}
        </div>
      </div>
    </Transition>
  );
};

export default Notification;
