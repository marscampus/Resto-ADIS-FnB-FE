import { DataTable } from 'primereact/datatable';
import { Column } from 'primereact/column';
import { Dialog } from 'primereact/dialog';
import { Button } from 'primereact/button';
import { InputText } from 'primereact/inputtext';
import { FileUpload } from 'primereact/fileupload';
import { InputNumber } from 'primereact/inputnumber';
import { Toast } from 'primereact/toast';
import { Image } from 'primereact/image';
import { FilterMatchMode } from 'primereact/api';
import React, { useEffect, useRef, useState } from 'react';
import { useFormik } from 'formik';
import { getEmail, getUserName, showError, showSuccess } from '../../../../component/GeneralFunction/GeneralFunction';
import { classNames } from 'primereact/utils';
import postData from '../../../../lib/Axios';
import { Toolbar } from 'primereact/toolbar';
import jsPDF from 'jspdf';
import { BlockUI } from 'primereact/blockui';
import AdjustPrintMarginLaporan from '../../../component/adjustPrintMarginLaporan';
import PDFViewer from '../../../../component/PDFViewer';
import { addPageInfo, Footer, HeaderLaporan } from '../../../../component/exportPDF/exportPDF';
import Produk from '../../../component/produk';
const Hadiah = () => {
    const epStore = '/api/hadiah/store';
    const epGet = '/api/hadiah/get';
    const epDelete = '/api/hadiah/delete';
    const epUpdate = '/api/hadiah/update';

    //state
    const toast = useRef(null);
    const [confHadiah, setConfHadiah] = useState({
        data: [],
        show: false,
        delete: false,
        edit: false,
        load: false,
        dialogProduk: false,
        searchVal: '',
        filters: { global: { value: null, matchMode: FilterMatchMode.CONTAINS } }
    });

    const [jsPdfPreviewOpen, setjsPdfPreviewOpen] = useState(false);
    const [pdfUrl, setPdfUrl] = useState('');
    const [adjustDialog, setAdjustDialog] = useState(false);
    const fileName = `hadiah-${new Date().toISOString().slice(0, 10)}`;
    const [loadingPreview, setLoadingPreview] = useState(false);

    //function
    const formik = useFormik({
        initialValues: {
            kode: '',
            barcode: '',
            nama_hadiah: '',
            nilai_hadiah: '',
            min_point: 1,
            foto: null
        },
        validate: (data) => {
            let errors = {};

            if (!data.barcode) {
                errors.barcode = 'Barcode Tidak Boleh Kosong';
            }
            if (!data.nama_hadiah) {
                errors.nama_hadiah = 'Nama Hadiah Tidak Boleh Kosong';
            }
            if (!data.nilai_hadiah) {
                errors.nilai_hadiah = 'Nilah Hadiah Tidak Boleh Kosong';
            }
            if (data.nilai_hadiah < 1) {
                errors.nilai_hadiah = 'Nilah Hadiah Tidak Kurang dari 1';
            }

            if (data.min_point < 1) {
                errors.min_point = 'Point Minimal Hadiah Tidak Kurang dari 1';
            }

            return errors;
        },
        onSubmit: (data) => {
            handleSave(data);
        }
    });

    const isFormFieldInvalid = (name) => !!(formik.touched[name] && formik.errors[name]);

    const getFormErrorMessage = (name) => {
        return isFormFieldInvalid(name) ? <small className="p-error">{formik.errors[name]}</small> : <small className="p-error">&nbsp;</small>;
    };

    const getData = async () => {
        setConfHadiah((p) => ({ ...p, load: true }));
        try {
            const res = await postData(epGet);
            // showSuccess(toast, res.data.message);

            setConfHadiah((p) => ({
                ...p,
                data: res.data.data
            }));
        } catch (error) {
            const e = error?.response?.data || error;
            showError(toast, e?.message || 'Terjadi Kesalahan');
        } finally {
            setConfHadiah((p) => ({ ...p, load: false }));
        }
    };

    const handleDelete = async () => {
        try {
            const res = await postData(epDelete, { kode: formik.values.kode });
            showSuccess(toast, res.data.message);
            getData();
            setConfHadiah((p) => ({ ...p, show: false, edit: false, delete: false }));
        } catch (error) {
            const e = error?.response?.data || error;
            showError(toast, e?.message || 'Terjadi Kesalahan');
        }
    };

    const handleSave = async (input) => {
        setConfHadiah((p) => ({ ...p, load: true }));
        try {
            let endpoint = '';
            let body = {
                ...input
            };
            if (confHadiah.edit) {
                endpoint = epUpdate;
            } else {
                endpoint = epStore;
            }

            const res = await postData(endpoint, body);
            showSuccess(toast, res.data.message);

            getData();
            setConfHadiah((p) => ({ ...p, load: false, show: false, edit: false, delete: false }));
        } catch (error) {
            const e = error?.response?.data || error;
            showError(toast, e?.message || 'Terjadi Kesalahan');
        } finally {
            setConfHadiah((p) => ({ ...p, load: false }));
        }
    };

    const onFileSelect = (event) => {
        const file = event.files[0];
        if (file.size > 900000) {
            formik.setFieldValue('foto', null);
            return showError(toast, 'File tidak boleh lebih dari 1MB.');
        }
        const reader = new FileReader();

        reader.onload = (e) => {
            formik.setFieldValue('foto', e.target.result);
        };

        if (file) {
            reader.readAsDataURL(file);
        }
    };

    useEffect(() => {
        getData();
    }, []);

    //template
    const headerTemplate = () => {
        return (
            <>
                <div className="flex justify-content-between">
                    <Button
                        label="Add"
                        onClick={() => {
                            setConfHadiah((p) => ({
                                ...p,
                                show: true,
                                edit: false,
                                delete: false
                            }));
                        }}
                    />
                    <InputText
                        value={confHadiah.searchVal}
                        placeholder="Search"
                        onChange={(e) => {
                            const value = e.target.value;
                            let _filters = { ...confHadiah.filters };

                            _filters['global'].value = value;

                            setConfHadiah((prev) => ({ ...prev, filters: _filters, searchVal: value }));
                        }}
                    />
                </div>
            </>
        );
    };

    const footerDeleteTemplate = (
        <div>
            <Button
                label="No"
                icon="pi pi-times"
                onClick={() => {
                    formik.resetForm();
                    setConfHadiah((p) => ({ ...p, show: false, edit: false, delete: false }));
                }}
                className="p-button-text"
            />
            <Button label="Yes" icon="pi pi-check" onClick={() => handleDelete()} />
        </div>
    );

    const actionBodyTemplate = (rowData) => {
        return (
            <>
                <Button
                    icon="pi pi-pencil"
                    severity="success"
                    rounded
                    className="mr-2"
                    onClick={() => {
                        setConfHadiah((p) => ({ ...p, show: true, edit: true, delete: false }));
                        formik.setValues({
                            kode: rowData.kode,
                            barcode: rowData.barcode,
                            nama_hadiah: rowData.nama_hadiah,
                            min_point: rowData.min_point,
                            nilai_hadiah: rowData.nilai_hadiah,
                            foto: rowData.foto
                        });
                    }}
                />
                <Button
                    icon="pi pi-trash"
                    onClick={() => {
                        formik.setValues((p) => ({
                            ...p,
                            kode: rowData.kode
                        }));
                        setConfHadiah((p) => ({ ...p, show: true, edit: false, delete: true }));
                    }}
                    severity="danger"
                    rounded
                />
            </>
        );
    };

    //  Yang Handle Gambar
    const imageBodyTemplate = (rowData) => {
        return (
            <>
                <Image
                    src={rowData.foto}
                    preview
                    width={100}
                />
            </>
        );
    };

    //  Yang Handle Preview
    const btnAdjust = () => {
        if (confHadiah.data.length == 0 || !confHadiah.data) {
            toast.current.show({ severity: 'error', summary: 'Error Message', detail: 'Tabel Masih Kosong', life: 3000 });
            return;
        }
        setAdjustDialog(true);
    };

    const handleAdjust = async (dataAdjust) => {
        exportPDF(dataAdjust);
    };

    const exportPDF = async (dataAdjust) => {
        setLoadingPreview(true);
        try {
            const marginLeftInMm = parseFloat(dataAdjust.marginLeft);
            const marginTopInMm = parseFloat(dataAdjust.marginTop);
            const marginRightInMm = parseFloat(dataAdjust.marginRight);
            const doc = new jsPDF({
                orientation: dataAdjust?.orientation,
                unit: 'mm',
                format: dataAdjust?.paperSize,
                left: marginLeftInMm,
                right: marginRightInMm,
                putOnlyUsedFonts: true
            });

            let paraf1 = dataAdjust?.paraf1 || '';
            let paraf2 = dataAdjust?.paraf2 || '';
            let namaPetugas1 = dataAdjust?.namaPetugas1 || '';
            let namaPetugas2 = dataAdjust?.namaPetugas2 || '';
            let jabatan1 = dataAdjust?.jabatan1 || '';
            let jabatan2 = dataAdjust?.jabatan2 || '';

            if (!confHadiah.data || confHadiah.data.length === 0) {
                doc.setFont('helvetica', 'normal');
                doc.setFontSize(11);
                doc.text('Data Kosong', doc.internal.pageSize.width / 2, 60 + marginTopInMm - 10, { align: 'center' });
            }

            const userName = await getUserName(await getEmail());

            const judulLaporan = 'Master Hadiah';
            const periodeLaporan = '';
            await HeaderLaporan({ doc, marginTopInMm, judulLaporan, periodeLaporan });

            const tableData = confHadiah.data.map((item) => [item.kode, item.barcode, item.nama_hadiah, parseInt(item.nilai_hadiah).toLocaleString(), item.min_point]);

            doc.autoTable({
                startY: 45 + marginTopInMm - 10,
                head: [['KODE', 'BARCODE', 'NAMA HADIAH', 'NILAI HADIAH', 'MIN. POINT']],
                body: tableData,
                theme: 'plain',
                margin: {
                    top: marginTopInMm,
                    left: marginLeftInMm,
                    right: marginRightInMm
                },
                styles: {
                    lineColor: [0, 0, 0],
                    lineWidth: 0.1,
                    fillColor: [255, 255, 255],
                    textColor: [0, 0, 0],
                    fontSize: 8
                },
                columnStyles: {
                    0: { halign: 'center' },
                    3: { halign: 'right' }
                },
                headerStyles: {
                    fillColor: [255, 255, 255],
                    textColor: [0, 0, 0],
                    fontStyle: 'bold',
                    halign: 'center'
                },
                didDrawPage: (data) => {
                    addPageInfo(doc, userName, marginRightInMm);
                }
            });

            await Footer({ doc, marginLeftInMm, marginTopInMm, marginRightInMm, paraf1, paraf2, namaPetugas1, namaPetugas2, jabatan1, jabatan2 });
            const pdfDataUrl = doc.output('datauristring');
            setPdfUrl(pdfDataUrl);
            setjsPdfPreviewOpen(true);
        } catch (error) {
            let e = error?.response?.data || error;
            showError(toast, e?.message || 'Terjadi Kesalahan');
        } finally {
            setLoadingPreview(false);
        }
    };

    // Yang Handle Excel
    const exportExcel = () => {
        exportToXLSX(confHadiah.data, 'master-hadiah.xlsx');
    };

    const footernya = () => {
        return (
            <React.Fragment>
                <div className="my-2 flex gap-2">
                    <Button label="Preview" outlined className="p-button-secondary p-button-sm mr-2" onClick={btnAdjust} />
                </div>
            </React.Fragment>
        );
    };

    const btnProduk = () => {
        setConfHadiah((p) => ({ ...p, dialogProduk: true }));
    }

    const handleProdukData = (dataProduk) => {
        console.log(dataProduk);

        formik.setValues((p) => ({
            ...p,
            kode: dataProduk.KODE,
            barcode: dataProduk.KODE_TOKO,
            nama_hadiah: dataProduk.NAMA,
            nilai_hadiah: dataProduk.HJ,
            foto: dataProduk.FOTO && dataProduk.FOTO.length > 10
                ? `data:image/jpeg;base64,${dataProduk.FOTO}`
                : null
        }));
    };

    return (
        <>
            <BlockUI
                blocked={loadingPreview}
                template={
                    <div className="flex align-items-center justify-content-center flex-column gap-3" style={{ height: '100%' }}>
                        <div className="pi pi-spin pi-spinner" style={{ fontSize: '6rem' }}></div>
                        <p>Loading...</p>
                    </ div>
                }
            >
                <Toast ref={toast} />
                <div className="card">
                    <h4>Master Hadiah</h4>
                    <DataTable size='small' value={confHadiah.data} loading={confHadiah.load} header={headerTemplate} paginator rows={10} filters={confHadiah.filters} globalFilterFields={['kode', 'barcode', 'nama_hadiah']}>
                        <Column field="kode" header="KODE" />
                        <Column field="barcode" header="BARCODE" />
                        <Column field="nama_hadiah" header="NAMA HADIAH" />
                        <Column field="nilai_hadiah" body={(rowData) => {
                            const value = rowData.nilai_hadiah ? parseInt(rowData.nilai_hadiah).toLocaleString() : "";
                            return value;
                        }} header="NILAI HADIAH" />
                        <Column field="min_point" header="POINT YG DITUKAR" />
                        <Column field="foto" header="GAMBAR" body={imageBodyTemplate} />
                        <Column header="ACTION" body={actionBodyTemplate} />
                    </DataTable>
                    <Toolbar className="mb-2" start={footernya}></Toolbar>
                </div>

                <Dialog
                    visible={confHadiah.show && !confHadiah.delete}
                    header={confHadiah.edit ? 'Edit Data Hadiah' : 'Tambah Data Hadiah'}
                    modal
                    style={{ width: '40%' }}
                    onHide={() => {
                        setConfHadiah((p) => ({ ...p, show: false, edit: false, delete: false }));
                        formik.resetForm();
                    }}
                >
                    <form onSubmit={formik.handleSubmit} className="flex flex-column gap-2">
                        <div className="flex flex-column gap-2">
                            <div className="flex lg:flex-row flex-column w-full gap-2">
                                <div className="flex flex-column gap-2 w-full">
                                    <label htmlFor="barcode">Nama Produk</label>
                                    <div className="p-inputgroup">
                                        <InputText
                                            id="barcode"
                                            name="barcode"
                                            value={formik.values.barcode}
                                            onChange={(e) => {
                                                formik.setFieldValue('barcode', e.target.value);
                                            }}
                                            readOnly
                                            className={isFormFieldInvalid('barcode') ? 'p-invalid' : ''}
                                        />
                                        <Button
                                            type="button"
                                            icon="pi pi-search"
                                            className="p-button"
                                            style={{
                                                "margin-left": "5px",
                                                "margin-right": "5px",
                                                borderRadius: "5px",
                                            }}
                                            onClick={() => btnProduk()}
                                        />
                                        <InputText style={{ width: "40%", borderRadius: "5px" }} disabled id="nama_hadiah" value={formik.values.nama_hadiah} />
                                    </div>
                                    {isFormFieldInvalid('barcode') ? getFormErrorMessage('barcode') : ''}
                                </div>
                            </div>
                            <div className="flex lg:flex-row flex-column w-full gap-2">
                                <div className="flex flex-column gap-2 w-full">
                                    <label htmlFor="nilai_hadiah">Nilai Hadiah</label>
                                    <div className="p-inputgroup">
                                        <InputNumber
                                            inputStyle={{ textAlign: 'right' }}
                                            id="nilai_hadiah"
                                            name="nilai_hadiah"
                                            mode="currency"
                                            currency="IDR"
                                            locale="ID-id"
                                            value={formik.values.nilai_hadiah}
                                            onChange={(e) => {
                                                formik.setFieldValue('nilai_hadiah', e.value);
                                            }}
                                            className={isFormFieldInvalid('nilai_hadiah') ? 'p-invalid' : ''}
                                        />
                                    </div>
                                    {isFormFieldInvalid('nilai_hadiah') ? getFormErrorMessage('nilai_hadiah') : ''}
                                </div>
                                <div className="flex flex-column gap-2 w-full">
                                    <label htmlFor="min_point">Point Yang Ditukar</label>
                                    <div className="p-inputgroup">
                                        <InputNumber
                                            inputStyle={{ textAlign: 'right' }}
                                            id="min_point"
                                            name="min_point"
                                            value={formik.values.min_point}
                                            onChange={(e) => {
                                                formik.setFieldValue('min_point', e.value);
                                            }}
                                            className={isFormFieldInvalid('min_point') ? 'p-invalid' : ''}
                                        />
                                    </div>
                                    {isFormFieldInvalid('min_point') ? getFormErrorMessage('min_point') : ''}
                                </div>
                            </div>

                            <div className="flex flex-column gap-2">
                                <label htmlFor="foto" className="font-medium">
                                    Foto Hadiah
                                </label>

                                <div className="border-round border-1 surface-border p-3">
                                    {formik.values.foto && formik.values.foto.length > 10 ? (
                                        <div className="relative">
                                            <img
                                                src={formik.values.foto}
                                                alt="Preview Foto"
                                                className="w-full border-round shadow-2"
                                                style={{
                                                    maxHeight: '400px',
                                                    objectFit: 'cover',
                                                    aspectRatio: '16/9'
                                                }}
                                            />
                                            <Button
                                                icon="pi pi-times"
                                                className="p-button-danger p-button-rounded p-button-sm absolute"
                                                style={{ top: '1rem', right: '1rem' }}
                                                onClick={() => formik.setFieldValue('foto', null)}
                                                tooltip="Hapus Foto"
                                                tooltipOptions={{ position: 'left' }}
                                            />
                                        </div>
                                    ) : (
                                        <FileUpload
                                            mode="advanced"
                                            name="foto"
                                            accept="image/*"
                                            chooseLabel="Pilih Foto"
                                            cancelLabel="Batal"
                                            uploadLabel="Upload"
                                            customUpload
                                            auto
                                            onSelect={onFileSelect}
                                            className={classNames({ 'p-invalid': isFormFieldInvalid('foto') })}
                                            emptyTemplate={
                                                <div className="flex align-items-center justify-content-center flex-column">
                                                    <i className="pi pi-image mt-3 p-5 border-round bg-surface-100" style={{ fontSize: '3em', borderRadius: '50%' }} />
                                                    <p className="mt-2 mb-0">Seret gambar ke sini atau klik untuk memilih</p>
                                                    <small className="text-color-secondary">Format yang didukung: JPEG, PNG</small>
                                                </div>
                                            }
                                        />
                                    )}
                                    {isFormFieldInvalid('foto') ? getFormErrorMessage('foto') : ''}
                                </div>
                            </div>
                        </div>
                        <Button type="submit" className="mt-2" loading={confHadiah.load} label={confHadiah.edit ? 'Update' : 'Save'} />
                    </form>
                </Dialog>

                <Dialog
                    header="Delete"
                    visible={confHadiah.show && confHadiah.delete}
                    onHide={() => {
                        formik.resetForm();
                        setConfHadiah((p) => ({ ...p, show: false, edit: false, delete: false }));
                    }}
                    footer={footerDeleteTemplate}
                >
                    <div className="flex align-items-center justify-content-center">
                        <i className="pi pi-exclamation-triangle mr-3" style={{ fontSize: '2rem' }} />
                        <span>
                            apakah kamu ingin menghapus  <strong>{formik.values.kode}</strong>
                        </span>
                    </div>
                </Dialog>
                <AdjustPrintMarginLaporan adjustDialog={adjustDialog} setAdjustDialog={setAdjustDialog} btnAdjust={btnAdjust} handleAdjust={handleAdjust} excel={exportExcel}></AdjustPrintMarginLaporan>
                <Dialog visible={jsPdfPreviewOpen} onHide={() => setjsPdfPreviewOpen(false)} modal style={{ width: '90%', height: '100%' }} header="PDF Preview">
                    <div className="p-dialog-content">
                        <PDFViewer pdfUrl={pdfUrl} fileName={fileName} />
                    </div>
                </Dialog>
                <Produk
                    produkDialog={confHadiah.dialogProduk}
                    setProdukDialog={() =>
                        setConfHadiah((p) => ({ ...p, dialogProduk: false }))
                    }
                    btnProduk={btnProduk}
                    handleProdukData={handleProdukData}
                />
            </BlockUI>
        </>
    );
};

export default Hadiah;
