import { useRouter } from 'next/router';
import { Button } from 'primereact/button';
import { InputText } from 'primereact/inputtext';
import { Toast } from 'primereact/toast';
import { Toolbar } from 'primereact/toolbar';
import React, { useRef, useState, useEffect } from 'react';
import postData from '../../../../lib/Axios';
import { getSessionServerSide } from '../../../../utilities/servertool';
import { showError, showSuccess } from '../../../../component/GeneralFunction/GeneralFunction';

export async function getServerSideProps(context) {
    const sessionData = await getSessionServerSide(context, context.resolvedUrl);
    if (sessionData?.redirect) {
        return sessionData;
    }
    return { props: {} };
}

const WIDTH = 500;

export default function AddBannerForm() {
    const router = useRouter();
    const { id } = router.query; // for edit mode: /banner/form?id=123
    const toast = useRef(null);

    const [keterangan, setKeterangan] = useState('');
    const [gambarBase64, setGambarBase64] = useState(null); // base64 string without prefix
    const [previewUrl, setPreviewUrl] = useState(null);
    const [isUploading, setIsUploading] = useState(false);
    const [isEditMode, setIsEditMode] = useState(false);
    const [originalData, setOriginalData] = useState(null);

    // Load existing banner if in edit mode
    useEffect(() => {
        if (id) {
            setIsEditMode(true);
            fetchBanner(id);
        }
    }, [id]);

    const fetchBanner = async (bannerId) => {
        try {
            const res = await postData('/api/banner/get', { id: bannerId });
            const data = res.data?.data;
            if (data) {
                setKeterangan(data.keterangan || '');
                setGambarBase64(data.gambar ? data.gambar : null);
                setPreviewUrl(data.gambar ? `data:image/jpeg;base64,${data.gambar}` : null);
                setOriginalData(data);
            }
        } catch (err) {
            showError(toast, 'Gagal memuat data banner');
        }
    };

    const handleFileChange = (file) => {
        if (!file) return;
        if (!file.type.match('image.*')) {
            showError(toast, 'File harus berupa gambar (jpg, png, dll)');
            return;
        }

        const reader = new FileReader();
        reader.onload = (e) => {
            const imageUrl = e.target.result;
            const img = new Image();
            img.src = imageUrl;
            img.onload = () => {
                const canvas = document.createElement('canvas');
                const ratio = WIDTH / img.width;
                canvas.width = WIDTH;
                canvas.height = img.height * ratio;
                const ctx = canvas.getContext('2d');
                ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
                const compressedDataUrl = canvas.toDataURL('image/jpeg', 0.9);
                const base64 = compressedDataUrl.split(',')[1]; // remove data:image/... prefix
                setGambarBase64(base64);
                setPreviewUrl(compressedDataUrl);
            };
        };
        reader.readAsDataURL(file);
    };

    const handleDrop = (e) => {
        e.preventDefault();
        const file = e.dataTransfer.files[0];
        handleFileChange(file);
    };

    const handleFileInput = (e) => {
        const file = e.target.files[0];
        handleFileChange(file);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!gambarBase64) {
            showError(toast, 'Gambar wajib diunggah');
            return;
        }

        const payload = {
            keterangan: keterangan.trim(),
            gambar: gambarBase64
        };

        if (id) payload.id = id;

        setIsUploading(true);
        try {
            const endpoint = id ? '/api/banner/update' : '/api/banner/store';
            const res = await postData(endpoint, payload);
            showSuccess(toast, res.data?.message || 'Berhasil menyimpan banner');
            setTimeout(() => router.push('/master/banner'), 500);
        } catch (err) {
            const msg = err?.response?.data?.message || 'Terjadi kesalahan';
            showError(toast, msg);
        } finally {
            setIsUploading(false);
        }
    };

    const handleCancel = () => {
        router.push('/master/banner');
    };

    const toolbarRight = (
        <>
            <Button label="Cancel" icon="pi pi-times" className="p-button-text" onClick={handleCancel} />
            <Button label="Save" icon="pi pi-check" className="p-button-text" onClick={handleSubmit} loading={isUploading} />
        </>
    );

    return (
        <div className="grid crud-demo">
            <div className="col-12">
                <div className="card">
                    <h4>{isEditMode ? 'Edit' : 'Upload'} Banner</h4>
                    <hr />
                    <Toast ref={toast} />

                    <div className="formgrid grid">
                        <div className="field col-12 mb-4">
                            <label htmlFor="keterangan">Keterangan</label>
                            <InputText
                                id="keterangan"
                                value={keterangan}
                                onChange={(e) => setKeterangan(e.target.value)}
                                placeholder="Masukkan keterangan (opsional)"
                                className="w-full"
                            />
                        </div>

                        <div className="field col-12 mb-4">
                            <label>Upload Gambar Banner</label>
                            <div
                                onDrop={handleDrop}
                                onDragOver={(e) => e.preventDefault()}
                                style={{
                                    width: '100%',
                                    height: '200px',
                                    border: '2px dashed #ccc',
                                    borderRadius: '8px',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    flexDirection: 'column',
                                    backgroundColor: '#fafafa'
                                }}
                            >
                                <input
                                    type="file"
                                    accept="image/*"
                                    style={{ display: 'none' }}
                                    id="fileInput"
                                    onChange={handleFileInput}
                                />
                                <Button
                                    type="button"
                                    label="Pilih atau Drop Gambar"
                                    icon="pi pi-upload"
                                    onClick={() => document.getElementById('fileInput').click()}
                                    className="p-button-outlined"
                                />
                                <small className="mt-2">Format: JPG, PNG (maks 5MB)</small>
                            </div>

                            {previewUrl && (
                                <div className="mt-3">
                                    <label>Preview:</label>
                                    <br />
                                    <img src={previewUrl} alt="Preview" style={{ maxWidth: '300px', maxHeight: '200px', marginTop: '10px' }} />
                                </div>
                            )}
                        </div>
                    </div>

                    <Toolbar right={toolbarRight} />
                </div>
            </div>
        </div>
    );
}
