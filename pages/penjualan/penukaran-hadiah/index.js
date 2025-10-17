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
import { useEffect, useRef, useState } from 'react';
import { useFormik } from 'formik';
import { convertToISODate, formatDatePdf, formatRibuan, getEmail, getUserName, showError, showSuccess } from '../../../component/GeneralFunction/GeneralFunction';
import { classNames } from 'primereact/utils';
import postData from '../../../lib/Axios';
import { Toolbar } from 'primereact/toolbar';
import { Calendar } from 'primereact/calendar';
import { formatDate } from '@fullcalendar/core';
import { addPageInfo, Footer, HeaderLaporan } from '../../../component/exportPDF/exportPDF';
import jsPDF from 'jspdf';
import PDFViewer from '../../../component/PDFViewer';
import AdjustPrintMarginLaporan from '../../component/adjustPrintMarginLaporan';
import { BlockUI } from 'primereact/blockui';

const Hadiah = () => {
    const epPenukaranGet = '/api/penukaran_point/get';
    const epPenukaranStore = '/api/penukaran_point/store';
    const epDelete = '/api/penukaran_point/delete';

    //state
    const toast = useRef(null);
    const [confHadiah, setConfHadiah] = useState({
        data: [],
        dataFilter: [],
        dataDetail: [],
        show: false,
        detail: false,
        load: false,
        searchVal: '',
        tglAwal: new Date(),
        tglAkhir: new Date(),
        faktur: ''
        // filters: { global: { value: null, matchMode: FilterMatchMode.CONTAINS } }
    });
    const [loadingPreview, setLoadingPreview] = useState(false);

    const [member, setMember] = useState({
        data: [],
        load: false,
        selectedMember: '',
        filters: { global: { value: null, matchMode: FilterMatchMode.CONTAINS } },
        searchVal: '',
        show: false
    });
    const [hadiah, setHadiah] = useState({
        data: [],
        load: false,
        selectedHadiah: '',
        filters: { global: { value: null, matchMode: FilterMatchMode.CONTAINS } },
        searchVal: '',
        show: false
    });

    const [pdf, setPdf] = useState({
        data: [],
        load: false,
        preview: false,
        url: ''
    });

    const [adjustDialog, setAdjustDialog] = useState(false);

    //function
    const formik = useFormik({
        initialValues: {
            tgl: new Date(),
            member: '',
            total: 0,
            detail: []
        },
        validate: (data) => {
            let errors = {};

            if (!data.member) {
                errors.member = 'Member Tidak Boleh Kosong';
            }
            if (data.detail.length < 1) {
                errors.barcode = 'Hadiah Belum Dipilih';
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
            const tglAwal = convertToISODate(confHadiah.tglAwal);
            const tglAkhir = convertToISODate(confHadiah.tglAkhir);

            const res = await postData(epPenukaranGet, { tglAwal, tglAkhir });
            // showSuccess(toast, res.data.message);

            setConfHadiah((p) => ({
                ...p,
                data: res.data.data
            }));
        } catch (error) {
            console.log(error);
            const e = error?.response?.data || error;
            showError(toast, e?.message || 'Terjadi Kesalahan');
        } finally {
            setConfHadiah((p) => ({ ...p, load: false }));
        }
    };
    const getDataMember = async () => {
        setMember((p) => ({ ...p, load: true }));
        try {
            const res = await postData('/api/member/get');
            // showSuccess(toast, res.data.message);

            setMember((p) => ({
                ...p,
                data: res.data.data
            }));
        } catch (error) {
            console.log(error);
            const e = error?.response?.data || error;
            showError(toast, e?.message || 'Terjadi Kesalahan');
        } finally {
            setMember((p) => ({ ...p, load: false }));
        }
    };
    const getDataHadiah = async () => {
        setHadiah((p) => ({ ...p, load: true }));
        try {
            const res = await postData('/api/hadiah/get');
            // showSuccess(toast, res.data.message);

            setHadiah((p) => ({
                ...p,
                data: res.data.data
            }));
        } catch (error) {
            console.log(error);
            const e = error?.response?.data || error;
            showError(toast, e?.message || 'Terjadi Kesalahan');
        } finally {
            setHadiah((p) => ({ ...p, load: false }));
        }
    };

    const onSelectHadiahQty = (e) => {
        const data = e.data;
        const existingData = [...formik.values.detail];

        const index = existingData.findIndex((item) => item.kode === data.kode);

        if (index !== -1) {
            const qty = (existingData[index].qty += 1);
            existingData[index].qty = qty;
            existingData[index].total = qty * data.min_point;
        } else {
            data.qty = 1;
            data.total = data.min_point * 1;
            existingData.push({ ...data });
        }

        setHadiah((p) => ({ ...p, show: false }));
        formik.setFieldValue('detail', existingData);
    };

    useEffect(() => {
        getData();
        getDataMember();
        getDataHadiah();
    }, []);

    useEffect(() => {
        setConfHadiah((p) => ({
            ...p,
            dataFilter: confHadiah.data
        }));
    }, [confHadiah.data]);

    const headerSearch = (
        <div className="flex flex-column md:flex-row md:justify-content-between md:align-items-center">
            <Button
                label="Tukar Point"
                onClick={() => {
                    setConfHadiah((p) => ({
                        ...p,
                        show: true,
                        detail: false
                    }));

                    setMember((p) => ({
                        ...p,
                        selectedMember: ''
                    }));

                    formik.resetForm();
                }}
            />
            <div className="flex flex-column md:flex-row md:justify-content-between md:align-items-center">
                <div className="p-inputgroup" style={{ display: 'flex', alignItems: 'center', marginRight: '0.5rem' }}>
                    <Calendar showIcon name="startDate" value={confHadiah.tglAwal} onChange={(e) => setConfHadiah((p) => ({ ...p, tglAwal: e.value }))} dateFormat="dd-mm-yy" />
                    <label style={{ margin: '5px' }}>s.d</label>
                    <Calendar showIcon name="startDate" value={confHadiah.tglAkhir} onChange={(e) => setConfHadiah((p) => ({ ...p, tglAkhir: e.value }))} dateFormat="dd-mm-yy" />
                    <Button icon="pi pi-refresh" className="p-button-primary mr-2" onClick={getData} style={{ marginLeft: '0.5rem' }} />
                </div>
                {/* <Dropdown value={defaultOption} onChange={(e) => setDropdownValue(e.value)} options={dropdownValues} optionLabel="label" placeholder="Pilih kolom" /> */}
                <span className="block mt-2 md:mt-0 p-input-icon-left">
                    <i className="pi pi-search" />
                    <InputText placeholder="Search" value={confHadiah.searchVal} onChange={(e) => filterOptions('search', e.target.value)} className="w-full" />
                </span>
            </div>
        </div>
    );

    const filterOptions = (name, searchVal) => {
        const x = searchVal.length > 0 ? new RegExp(searchVal, 'i') : null;
        let filtered = [];

        if (name == 'search') {
            filtered = confHadiah.data.filter((d) => (x ? x.test(d.faktur) || x.test(d.username) || x.test(d.member) : []));
            setConfHadiah((p) => ({
                ...p,
                searchVal
            }));
        } else {
            if (searchVal == 'all') {
                filtered = confHadiah.data;
            } else {
                filtered = confHadiah.data.filter((d) => (x ? x.test(d.faktur) : []));
            }
        }

        setConfHadiah((p) => ({
            ...p,
            dataFilter: filtered
        }));
    };

    const onCellEditComplete = (e) => {
        // e.preventDefault();
        let { rowData, newValue, field, originalEvent: event } = e;
        const existingData = [...formik.values.detail];
        const index = existingData.findIndex((item) => item.kode === rowData.kode);

        console.log(newValue);

        existingData[index].qty = newValue;
        existingData[index].total = newValue * rowData.min_point;

        formik.setFieldValue('detail', existingData);
    };

    useEffect(() => {
        const total = formik.values.detail.reduce((sum, item) => sum + item.qty * item.min_point, 0);
        formik.setFieldValue('total', total);
    }, [formik.values.detail]);

    const actionBodyTabel = (rowData) => {
        return (
            <>
                <Button
                    icon="pi pi-trash"
                    style={{ backgroundColor: '#ca656f', border: '1px solid #ca656f' }}
                    className="p-button-danger p-button p-button-sm mr-2"
                    onClick={() => {
                        const updatedData = formik.values.detail.filter((item) => item.kode !== rowData.kode);

                        formik.setFieldValue('detail', updatedData);
                    }}
                />
            </>
        );
    };

    const handleSave = async (input) => {
        setConfHadiah((p) => ({ ...p, load: true }));
        try {
            input.tgl = convertToISODate(input.tgl);
            const res = await postData(epPenukaranStore, input);
            showSuccess(toast, res.data.message);

            getData();
            getDataMember();
            getDataHadiah();
            setConfHadiah((p) => ({ ...p, load: false, show: false, edit: false, delete: false }));
        } catch (error) {
            console.log(error);
            const e = error?.response?.data || error;
            showError(toast, e?.message || 'Terjadi Kesalahan');
        } finally {
            setConfHadiah((p) => ({ ...p, load: false }));
        }
    };

    //template

    const btnAdjust = () => {
        if (confHadiah.dataFilter.length == 0 || !confHadiah.dataFilter) {
            toast.current.show({ severity: 'error', summary: 'Error Message', detail: 'Tabel Masih Kosong', life: 3000 });
            return;
        }

        setAdjustDialog(true);
    };

    const handleAdjust = async (dataAdjust) => {
        exportPDF(dataAdjust);
    };

    //tamplete

    const exportPDF = async (dataAdjust) => {
        setLoadingPreview(true);
        try {
            const penukaran = confHadiah.dataFilter ? JSON.parse(JSON.stringify(confHadiah.dataFilter)) : [];
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

            if (!penukaran || penukaran.length === 0) {
                doc.setFont('helvetica', 'normal');
                doc.setFontSize(11);
                doc.text('Data Kosong', doc.internal.pageSize.width / 2, 60 + marginTopInMm - 10, { align: 'center' });
            }

            const userName = await getUserName(await getEmail());

            const judulLaporan = 'Laporan Penukaran Point';
            const periodeLaporan = 'Antara Tanggal ' + formatDate(confHadiah.tglAwal) + 's.d ' + formatDate(confHadiah.tglAkhir);
            await HeaderLaporan({ doc, marginTopInMm, judulLaporan, periodeLaporan });

            const tableData = penukaran.map((item) => [item.faktur, formatDatePdf(item.tgl), item.member, formatRibuan(item.total), item.username]);

            doc.autoTable({
                startY: 45 + marginTopInMm - 10,
                head: [['Faktur', 'Tanggal', 'Penukar', 'Total', 'Username']],
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
                    10: { halign: 'right' },
                    11: { halign: 'right' },
                    12: { halign: 'right' },
                    13: { halign: 'right' },
                    14: { halign: 'right' }
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

            setPdf((p) => ({
                ...p,
                preview: true,
                url: pdfDataUrl
            }));
            setAdjustDialog(false);
        } catch (error) {
            let e = error?.response?.data || error;
            showError(toast, e?.message || 'Terjadi Kesalahan');
        } finally {
            setLoadingPreview(false);
        }
    };

    // Yang Handle Excel
    const exportExcel = () => {
        exportToXLSX(confHadiah.dataFilter, 'laporan-penukaran-point.xlsx');
    };

    const endToolbarTemplate = () => {
        return (
            <>
                <Button label="Preview" outlined className="p-button-secondary p-button-sm mr-2" onClick={btnAdjust} />
            </>
        );
    };
    const detailTemplate = (rowData) => {
        return (
            <>
                <Button
                    icon="pi pi-file-word"
                    severity="warning"
                    rounded
                    className="mr-2"
                    onClick={() => {
                        setConfHadiah((p) => ({
                            ...p,
                            show: true,
                            detail: true,
                            dataDetail: rowData.detail
                        }));
                    }}
                />

                <Button
                    icon="pi pi-trash"
                    severity="danger"
                    rounded
                    className="mr-2"
                    onClick={() => {
                        setConfHadiah((p) => ({ ...p, faktur: rowData.faktur, show: false, edit: false, delete: true }));
                    }}
                />
            </>
        );
    };

    const textEditor = (options) => {
        return (
            <InputText
                type="number"
                step="any"
                onKeyDown={(e) => {
                    if (e.key == 'Enter') {
                        e.preventDefault();
                        // e.stopPropagation();
                    }
                }}
                value={options.value}
                onChange={(e) => options.editorCallback(e.target.value)}
            />
        );
    };

    const handleDelete = async () => {
        try {
            const res = await postData(epDelete, { faktur: confHadiah.faktur });
            showSuccess(toast, res.data.message);
            getData();
            setConfHadiah((p) => ({ ...p, show: false, edit: false, delete: false }));
        } catch (error) {
            const e = error?.response?.data || error;
            showError(toast, e?.message || 'Terjadi Kesalahan');
        }
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
                    <h4>Penukaran Point</h4>
                    <DataTable size='small' value={confHadiah.dataFilter} loading={confHadiah.load} header={headerSearch} paginator rows={10}>
                        <Column field="faktur" header="FAKTUR" />
                        <Column field="tgl" header="TANGGAL" />
                        <Column field="username" header="USERNAME" />
                        <Column field="member" header="MEMBER" />
                        <Column field="total_point" body={(rowData) => {
                            const value = rowData.total_point ? parseInt(rowData.total_point).toLocaleString() : "";
                            return value;
                        }} header="TOTAL POINT YANG DITUKAR" />
                        <Column header='ACTION' body={detailTemplate} />
                    </DataTable>
                    <Toolbar start={endToolbarTemplate} />
                </div>

                <Dialog
                    visible={confHadiah.show && confHadiah.detail}
                    onHide={() => {
                        setConfHadiah((p) => ({
                            ...p,
                            show: false,
                            detail: false,
                            dataDetail: []
                        }));
                    }}
                >
                    <div className="">
                        <DataTable size='small' value={confHadiah.dataDetail} paginator rows={10}>
                            <Column field="kode" header="Kode" />
                            <Column field="nama_hadiah" header="Hadiah" />
                            <Column field="nilai_hadiah" body={(rowData) => {
                                const value = rowData.nilai_hadiah ? parseInt(rowData.nilai_hadiah).toLocaleString() : "";
                                return value;
                            }} header="Nilai Hadiah" />
                            <Column field="qty" header="Qty" />
                        </DataTable>
                    </div>
                </Dialog>

                <Dialog
                    header="Penukaran Point"
                    style={{ width: '90%' }}
                    visible={confHadiah.show && !confHadiah.detail}
                    onHide={() => {
                        setConfHadiah((p) => ({
                            ...p,
                            show: false,
                            detail: false
                        }));
                    }}
                >
                    <form onSubmit={formik.handleSubmit} className="flex flex-column gap-2">
                        <div className="flex flex-column gap-2">
                            <div className="flex lg:flex-row flex-column w-full gap-2">
                                <div className="field w-full">
                                    <label htmlFor="member">Member</label>
                                    <div className="p-inputgroup">
                                        <InputText
                                            id="member"
                                            onKeyDown={(e) => {
                                                if (e.key == 'Enter') {
                                                    e.preventDefault();
                                                    e.stopPropagation();
                                                }
                                            }}
                                            readOnly
                                            value={member.selectedMember}
                                        />
                                        <Button
                                            icon="pi pi-search"
                                            className="p-button"
                                            onClick={(e) => {
                                                e.preventDefault();
                                                setMember((p) => ({ ...p, show: true }));
                                            }}
                                        />
                                    </div>
                                    {isFormFieldInvalid('member') ? getFormErrorMessage('member') : ''}
                                </div>
                                <div className="field w-full">
                                    <label htmlFor="hadiah">Hadiah</label>
                                    <div className="p-inputgroup">
                                        <InputText
                                            id="hadiah"
                                            readOnly
                                            onKeyDown={(e) => {
                                                if (e.key == 'Enter') {
                                                    e.preventDefault();
                                                    e.stopPropagation();
                                                    // e.target.blur();
                                                }
                                            }}
                                            value={hadiah.selectedHadiah}
                                        />
                                        <Button
                                            icon="pi pi-search"
                                            className="p-button"
                                            onClick={(e) => {
                                                e.preventDefault();
                                                setHadiah((p) => ({ ...p, show: true }));
                                            }}
                                        />
                                    </div>
                                </div>
                            </div>

                            <div className="flex flex-column w-full">
                                <DataTable size='small' value={formik.values.detail} lazy dataKey="kode" rows={10} editMode="cell" scrollable scrollHeight="200px" frozenFooter>
                                    <Column headerStyle={{ textAlign: 'center' }} field="kode" header="KODE"></Column>
                                    <Column headerStyle={{ textAlign: 'center' }} field="nama_hadiah" header="NAMA HADIAH"></Column>
                                    <Column field="min_point" header="POINT YANG DITUKAR"></Column>
                                    <Column
                                        headerStyle={{ textAlign: 'center' }}
                                        field="qty"
                                        header="QTY"
                                        body={(rowData) => {
                                            const value = rowData.qty ? parseInt(rowData.qty).toLocaleString() : "";
                                            return value;
                                        }}
                                        editor={(options) => textEditor(options)}
                                        onCellEditComplete={onCellEditComplete}
                                        bodyStyle={{ textAlign: 'center' }}
                                    ></Column>
                                    <Column field="total" header="TOTAL POINT YANG DITUKAR" body={(rowData) => formatRibuan(rowData.total)} footer={() => formatRibuan(formik.values.total)}></Column>
                                    <Column header="ACTION" body={actionBodyTabel} />
                                </DataTable>
                            </div>
                        </div>
                        <Button type="submit" className="mt-2" loading={confHadiah.load} label={confHadiah.edit ? 'Update' : 'Save'} />
                    </form>
                </Dialog>

                <Dialog style={{ width: '40%' }} header="Data Member" visible={member.show} onHide={() => setMember((p) => ({ ...p, show: false }))}>
                    <DataTable
                        size="small"
                        header={() => {
                            return (
                                <div className="flex justify-content-end w-full">
                                    <span className="block mt-2 md:mt-0 p-input-icon-left">
                                        <i className="pi pi-search" />
                                        <InputText
                                            placeholder="Search"
                                            value={member.searchVal}
                                            onChange={(e) => {
                                                const value = e.target.value;
                                                let _filters = { ...member.filters };
                                                _filters['global'].value = value;
                                                setMember((p) => ({ ...p, filters: _filters, searchVal: value }));
                                            }}
                                            className="w-full"
                                        />
                                    </span>
                                </div>
                            );
                        }}
                        value={member.data}
                        loading={member.load}
                        rows={10}
                        paginator
                        onRowSelect={(e) => {
                            setMember((p) => ({ ...p, selectedMember: e.data.NAMA, show: false }));
                            formik.setFieldValue('member', e.data.KODE);
                        }}
                        selectionMode="single"
                        filters={member.filters}
                        globalFilterFields={['KODE', 'NAMA']}
                    >
                        <Column field="KODE" header="Kode" />
                        <Column field="NAMA" header="Nama" />
                        <Column field="SISA_POINT" header="Point" />
                    </DataTable>
                </Dialog>
                <Dialog style={{ width: '40%' }} header="Data Hadiah" visible={hadiah.show} onHide={() => setHadiah((p) => ({ ...p, show: false }))}>
                    <DataTable
                        size="small"
                        header={() => {
                            return (
                                <div className="flex justify-content-end w-full">
                                    <span className="block mt-2 md:mt-0 p-input-icon-left">
                                        <i className="pi pi-search" />
                                        <InputText
                                            placeholder="Search"
                                            value={hadiah.searchVal}
                                            onChange={(e) => {
                                                const value = e.target.value;
                                                let _filters = { ...hadiah.filters };
                                                _filters['global'].value = value;
                                                setHadiah((p) => ({ ...p, filters: _filters, searchVal: value }));
                                            }}
                                            className="w-full"
                                        />
                                    </span>
                                </div>
                            );
                        }}
                        value={hadiah.data}
                        loading={hadiah.load}
                        rows={10}
                        paginator
                        onRowSelect={(e) => {
                            onSelectHadiahQty(e);
                        }}
                        selectionMode="single"
                        filters={hadiah.filters}
                        globalFilterFields={['kode', 'nama_hadiah']}
                    >
                        <Column field="kode" header="KODE" />
                        <Column field="nama_hadiah" header="NAMA" />
                        <Column field="min_point" header="POINT MINIMAL" />
                        <Column body={(rowData) => {
                            const value = rowData.nilai_hadiah ? parseInt(rowData.nilai_hadiah).toLocaleString() : "";
                            return value;
                        }} field="nilai_hadiah" header="NILAI" />
                    </DataTable>
                </Dialog>
                <Dialog
                    header="Hapus"
                    visible={confHadiah.delete}
                    onHide={() => {
                        formik.resetForm();
                        setConfHadiah((p) => ({ ...p, show: false, edit: false, delete: false }));
                    }}
                    footer={footerDeleteTemplate}
                >
                    <div className="flex align-items-center justify-content-center">
                        <i className="pi pi-exclamation-triangle mr-3" style={{ fontSize: '2rem' }} />
                        <span>
                            apakah kamu ingin menghapus  <strong>{confHadiah.faktur}</strong>
                        </span>
                    </div>
                </Dialog>
                <AdjustPrintMarginLaporan adjustDialog={adjustDialog} setAdjustDialog={setAdjustDialog} btnAdjust={btnAdjust} handleAdjust={handleAdjust} excel={exportExcel}></AdjustPrintMarginLaporan>
                <Dialog visible={pdf.preview} onHide={() => setPdf((p) => ({ ...p, preview: false }))} modal style={{ width: '90%', height: '100%' }} header="PDF Preview">
                    <div className="p-dialog-content">
                        <PDFViewer pdfUrl={pdf.url} />
                    </div>
                </Dialog>
            </BlockUI>
        </>
    );
};

export default Hadiah;
