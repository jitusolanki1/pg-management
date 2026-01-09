/**
 * Delete Confirmation Dialog Component
 * A proper dialog (not modal popup) for delete confirmations
 */

import { useEffect, useRef } from "react"
import { Button } from "./Button"

export function DeleteDialog({
    isOpen,
    onClose,
    onConfirm,
    title = "Delete Item",
    description = "Are you sure you want to delete this item? This action cannot be undone.",
    itemName = "",
    isLoading = false,
}) {
    const dialogRef = useRef(null)
    const confirmButtonRef = useRef(null)

    // Focus management
    useEffect(() => {
        if (isOpen && confirmButtonRef.current) {
            confirmButtonRef.current.focus()
        }
    }, [isOpen])

    // Handle escape key
    useEffect(() => {
        const handleEscape = (e) => {
            if (e.key === "Escape" && isOpen) {
                onClose()
            }
        }

        document.addEventListener("keydown", handleEscape)
        return () => document.removeEventListener("keydown", handleEscape)
    }, [isOpen, onClose])

    // Prevent scroll when open
    useEffect(() => {
        if (isOpen) {
            document.body.style.overflow = "hidden"
        } else {
            document.body.style.overflow = ""
        }
        return () => {
            document.body.style.overflow = ""
        }
    }, [isOpen])

    if (!isOpen) return null

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
            {/* Backdrop */}
            <div
                className="absolute inset-0 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200"
                onClick={onClose}
            />

            {/* Dialog */}
            <div
                ref={dialogRef}
                role="alertdialog"
                aria-modal="true"
                aria-labelledby="delete-dialog-title"
                aria-describedby="delete-dialog-description"
                className="relative bg-white rounded-xl shadow-2xl w-full max-w-md mx-4 animate-in zoom-in-95 duration-200"
            >
                {/* Icon */}
                <div className="flex justify-center pt-6">
                    <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center">
                        <svg
                            className="w-8 h-8 text-danger"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                        >
                            <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                            />
                        </svg>
                    </div>
                </div>

                {/* Content */}
                <div className="p-6 text-center">
                    <h3
                        id="delete-dialog-title"
                        className="text-xl font-bold text-text-main mb-2"
                    >
                        {title}
                    </h3>

                    <p
                        id="delete-dialog-description"
                        className="text-text-muted mb-2"
                    >
                        {description}
                    </p>

                    {itemName && (
                        <div className="bg-gray-100 rounded-lg px-4 py-3 mt-4">
                            <p className="text-sm text-text-muted">Item to delete:</p>
                            <p className="font-semibold text-text-main truncate">{itemName}</p>
                        </div>
                    )}
                </div>

                {/* Actions */}
                <div className="flex gap-3 px-6 pb-6">
                    <Button
                        variant="secondary"
                        className="flex-1"
                        onClick={onClose}
                        disabled={isLoading}
                    >
                        Cancel
                    </Button>
                    <Button
                        ref={confirmButtonRef}
                        variant="danger"
                        className="flex-1"
                        onClick={onConfirm}
                        disabled={isLoading}
                    >
                        {isLoading ? (
                            <span className="flex items-center gap-2">
                                <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                                </svg>
                                Deleting...
                            </span>
                        ) : (
                            "Delete"
                        )}
                    </Button>
                </div>
            </div>
        </div>
    )
}

export default DeleteDialog
