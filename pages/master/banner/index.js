import { useRouter } from 'next/router';
import { Button } from 'primereact/button';
import { Column } from 'primereact/column';
import { DataTable } from 'primereact/datatable';
import { Dialog } from 'primereact/dialog';
import { InputText } from 'primereact/inputtext';
import { Toast } from 'primereact/toast';
import { Toolbar } from 'primereact/toolbar';
import React, { useEffect, useRef, useState } from 'react';
import postData from '../../../lib/Axios';
import { getSessionServerSide } from '../../../utilities/servertool';
import { showError, showSuccess } from '../../../component/GeneralFunction/GeneralFunction';

export async function getServerSideProps(context) {
    const sessionData = await getSessionServerSide(context, context.resolvedUrl);
    if (sessionData?.redirect) {
        return sessionData;
    }
    return { props: {} };
}

const WIDTH = 500;

export default function MasterBanner() {
    const apiEndPointGet = '/api/banner/get';
    const apiEndPointStore = '/api/banner/store';
    const toast = useRef(null);

    const [banners, setBanners] = useState([]);
    const [loading, setLoading] = useState(false);
    const [totalRecords, setTotalRecords] = useState(0);
    const [lazyState, setLazyState] = useState({
        first: 0,
        rows: 10,
        page: 0,
        sortField: null,
        sortOrder: null,
        filters: {}
    });

    // Dialog state
    const [uploadDialogVisible, setUploadDialogVisible] = useState(false);
    const [keterangan, setKeterangan] = useState('');
    const [gambarBase64, setGambarBase64] = useState(null);
    const [previewUrl, setPreviewUrl] = useState(null);
    const [isUploading, setIsUploading] = useState(false);

    useEffect(() => {
        loadBanners();
    }, [lazyState]);

    const loadBanners = async () => {
        setLoading(true);
        try {
            const response = await postData(apiEndPointGet, lazyState);
            const data = response;
            // setBanners(data.data || []);
            // setTotalRecords(data.total_data || 0);
        } catch (error) {
            const msg = error?.response?.data?.message || 'Gagal memuat data banner';
            showError(toast, msg);
        } finally {
            setLoading(false);
        }
    };

    // === File Handling ===
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
                const base64 = compressedDataUrl.split(',')[1];
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

    // === Dialog Handlers ===
    const openUploadDialog = () => {
        setKeterangan('');
        setGambarBase64(null);
        setPreviewUrl(null);
        setUploadDialogVisible(true);
    };

    const hideUploadDialog = () => {
        setUploadDialogVisible(false);
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

        setIsUploading(true);
        try {
            const res = await postData(apiEndPointStore, payload);
            showSuccess(toast, res.data?.message || 'Berhasil menyimpan banner');
            hideUploadDialog();
            loadBanners(); // refresh table
        } catch (err) {
            const msg = err?.response?.data?.message || 'Terjadi kesalahan';
            showError(toast, msg);
        } finally {
            setIsUploading(false);
        }
    };

    // === UI Templates ===
    const leftToolbarTemplate = () => {
        return (
            <div className="my-2">
                <Button label="Upload Banner" icon="pi pi-plus" className="p-button-success" onClick={openUploadDialog} />
            </div>
        );
    };

    const imageBodyTemplate = (rowData) => {
        return rowData.gambar ? (
            <img
                src={rowData.gambar}
                alt="Banner"
                onError={(e) => (e.target.style.display = 'none')}
                style={{ width: '100px', height: 'auto', objectFit: 'cover', borderRadius: '4px' }}
            />
        ) : (
            <span>Tidak ada gambar</span>
        );
    };

    const onPage = (event) => {
        setLazyState(event);
    };

    return (
        <div className="grid crud-demo">
            <div className="col-12">
                <div className="card">
                    <h4>Daftar Banner</h4>
                    <hr />
                    <Toast ref={toast} />
                    <Toolbar className="mb-4" left={leftToolbarTemplate} />

                    <DataTable
                        value={banners}
                        paginator
                        rows={lazyState.rows}
                        first={lazyState.first}
                        totalRecords={totalRecords}
                        onPage={onPage}
                        loading={loading}
                        emptyMessage="Tidak ada banner."
                        className="datatable-responsive"
                        size="small"
                    >
                        <Column field="id" header="ID" style={{ width: '80px' }} />
                        <Column field="keterangan" header="Keterangan" />
                        <Column header="Gambar" body={imageBodyTemplate} style={{ width: '150px' }} />
                    </DataTable>
                </div>
            </div>

            {/* Upload Banner Dialog */}
            <Dialog
                visible={uploadDialogVisible}
                header="Upload Banner"
                modal
                className="p-fluid"
                style={{ width: '500px' }}
                onHide={hideUploadDialog}
                footer={
                    <>
                        <Button label="Cancel" icon="pi pi-times" className="p-button-text" onClick={hideUploadDialog} />
                        <Button
                            label="Simpan"
                            icon="pi pi-check"
                            className="p-button-text"
                            onClick={handleSubmit}
                            loading={isUploading}
                            disabled={!gambarBase64}
                        />
                    </>
                }
            >
                <div className="field mb-3">
                    <label htmlFor="keterangan">Keterangan</label>
                    <InputText
                        id="keterangan"
                        value={keterangan}
                        onChange={(e) => setKeterangan(e.target.value)}
                        placeholder="Opsional"
                        className="w-full"
                    />
                </div>

                <div className="field">
                    <label>Upload Gambar</label>
                    <div
                        onDrop={handleDrop}
                        onDragOver={(e) => e.preventDefault()}
                        style={{
                            width: '100%',
                            height: '180px',
                            border: '2px dashed #ccc',
                            borderRadius: '8px',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            flexDirection: 'column',
                            backgroundColor: '#fafafa',
                            marginTop: '8px'
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
                            className="p-button-outlined p-button-sm"
                        />
                        <small className="mt-2">Format: JPG, PNG</small>
                    </div>

                    {previewUrl && (
                        <div className="mt-3">
                            <label>Preview:</label>
                            <br />
                            <img
                                src={previewUrl}
                                alt="Preview"
                                style={{ maxWidth: '250px', maxHeight: '150px', marginTop: '8px' }}
                            />
                        </div>
                    )}
                </div>
            </Dialog>
        </div>
    );
}
