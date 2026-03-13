import { CheckCircle2, ImageIcon, UploadIcon } from 'lucide-react';
import React, { useCallback, useState } from 'react'
import { useOutletContext } from 'react-router';
import { ALLOWED_MIME_TYPES, MAX_FILE_SIZE, PROGRESS_INTERVAL_MS, PROGRESS_STEP, REDIRECT_DELAY_MS } from '../lib/constants';

interface UploadProps {
    onComplete: (base64: string) => void;
}

const Upload = ({ onComplete }: UploadProps) => {
    const [file, setFile] = useState<File | null>(null);
    const [isDragging, setIsDragging] = useState(false);
    const [progress, setProgress] = useState(0);
    const [error, setError] = useState<string | null>(null);

    const { isSignedIn } = useOutletContext<AuthContext>();

    const processFile = useCallback((selectedFile: File) => {
        setError(null);

        if (!ALLOWED_MIME_TYPES.includes(selectedFile.type as typeof ALLOWED_MIME_TYPES[number])) {
            setError('Invalid file type. Please upload a JPG or PNG image.');
            return;
        }

        if (selectedFile.size > MAX_FILE_SIZE) {
            setError('File is too large. Maximum size is 10 MB.');
            return;
        }

        setFile(selectedFile);
        setProgress(0);

        const reader = new FileReader();
        reader.onload = () => {
            const base64 = reader.result as string;

            const interval = setInterval(() => {
                setProgress((prev) => {
                    const next = prev + PROGRESS_STEP;
                    if (next >= 100) {
                        clearInterval(interval);
                        setTimeout(() => onComplete(base64), REDIRECT_DELAY_MS);
                        return 100;
                    }
                    return next;
                });
            }, PROGRESS_INTERVAL_MS);
        };
        reader.readAsDataURL(selectedFile);
    }, [onComplete]);

    const handleDragOver = useCallback((e: React.DragEvent<HTMLDivElement>) => {
        e.preventDefault();
        if (!isSignedIn) return;
        setIsDragging(true);
    }, [isSignedIn]);

    const handleDragLeave = useCallback((e: React.DragEvent<HTMLDivElement>) => {
        e.preventDefault();
        setIsDragging(false);
    }, []);

    const handleDrop = useCallback((e: React.DragEvent<HTMLDivElement>) => {
        e.preventDefault();
        setIsDragging(false);
        if (!isSignedIn) return;
        const droppedFile = e.dataTransfer.files[0];
        if (droppedFile) processFile(droppedFile);
    }, [isSignedIn, processFile]);

    const handleChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
        if (!isSignedIn) return;
        const selectedFile = e.target.files?.[0];
        if (selectedFile) processFile(selectedFile);
    }, [isSignedIn, processFile]);

    return (
        <div className='upload'>
            {!file ? (
                <div
                    className={`dropzone ${isDragging ? 'is-dragging' : ''}`}
                    onDragOver={handleDragOver}
                    onDragLeave={handleDragLeave}
                    onDrop={handleDrop}
                >
                    
                    <input 
                    type="file" 
                    className='drop-input' 
                    accept='.jpg,.jpeg,.png' 
                    disabled={!isSignedIn}
                    onChange={handleChange} />

                <div className='drop-content'>
                    <div className='drop-icon'>
                        <UploadIcon size={20} />

                    </div>
                    <p>
                        {isSignedIn ? 'Drop your image here' : 'Please sign in to upload an image'}
                    </p>
                    <p className='help'> Maximum file size 10 MB.</p>
                    {error && <p className='error'>{error}</p>}
                </div>
                </div>
            ) : (
                <div className='upload-status'>
                    <div className='status-content'> 
                        <div className='status-icon'>
                            {progress === 100 ? (
                                <CheckCircle2 className='check' />
                            ) : (
                                <ImageIcon className='image' />
                            )}
                        </div>
                            <h3>{file.name}</h3>
                                <div className='progress'>
                                    <div className='bar' style={{width: `${progress}%`}} />
                                </div>
                                <p className='status-text'>
                                    {progress< 100 ? `Uploading... ${progress}%` : 'Upload complete!'}
                                </p>
                    </div>

                    
                </div>
            )}
        </div>
    )
}

export default Upload