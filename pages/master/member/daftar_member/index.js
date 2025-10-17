import { Button } from 'primereact/button';
import { Column } from 'primereact/column';
import { DataTable } from 'primereact/datatable';
import { Dialog } from 'primereact/dialog';
import { InputText } from 'primereact/inputtext';
import { InputTextarea } from 'primereact/inputtextarea';
import { TabPanel, TabView } from 'primereact/tabview';
import { Toast } from 'primereact/toast';
import { Toolbar } from 'primereact/toolbar';
import { classNames } from 'primereact/utils';
import React, { useEffect, useRef, useState } from 'react';
import Member from '../../../component/jenis_member';
import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import { Footer, HeaderLaporan, addPageInfo } from '../../../../component/exportPDF/exportPDF';
import { exportToXLSX } from '../../../../component/exportXLSX/exportXLSX';
import { getEmail, getUserName, showError, showSuccess } from '../../../../component/GeneralFunction/GeneralFunction';
import PDFViewer from '../../../../component/PDFViewer';
import postData from '../../../../lib/Axios';
import { getSessionServerSide } from '../../../../utilities/servertool';
import AdjustPrintMarginLaporan from '../../../component/adjustPrintMarginLaporan';
import MultipleRekeningCOA from '../../../component/multipleRekeningCOA';
import { InputNumber } from 'primereact/inputnumber';
import { BlockUI } from 'primereact/blockui';
export async function getServerSideProps(context) {
    const sessionData = await getSessionServerSide(context, context.resolvedUrl);
    if (sessionData?.redirect) {
        return sessionData;
    }
    return {
        props: {}
    };
}
export default function MasterMember() {
    // API READ
    const apiEndPointGet = '/api/member/get';
    const apiEndPointGetMember = '/api/member/kode';
    // API DELETE
    const apiEndPointDelete = '/api/member/delete';
    const apiEndPointStatus = '/api/member/status';
    // API STORE
    const apiEndPointStore = '/api/member/store';
    const apiEndPointKonversi = '/api/member/konversi';
    // API EDIT
    const apiEndPointUpdate = '/api/member/update';
    // API RESET
    const apiEndPointReset = '/api/member/reset';

    const toast = useRef(null);
    const [submitted, setSubmitted] = useState(false);
    const [loading, setLoading] = useState(false);
    const [loadingPreview, setLoadingPreview] = useState(false);
    const [daftarMemberDialog, setDaftarMemberDialog] = useState(false);
    const [totalRecords, setTotalRecords] = useState(0);
    const [activeIndexMember, setActiveIndexMember] = useState(0);
    const [member, setMember] = useState([]);
    const [data, setData] = useState(null);
    const [contactPerson1, setContactPerson1] = useState(null);
    const [memberTabel, setMemberTabel] = useState(null);
    const [memberTabelFilt, setMemberTabelFilt] = useState(null);
    const [statusAction, setStatusAction] = useState(null);
    const [deleteMemberDialog, setDeleteMemberDialog] = useState(false);
    const [resetPointMemberDialog, setResetPointMemberDialog] = useState(false);
    const [isUpdateMode, setIsUpdateMode] = useState(false);
    const [adjustDialog, setAdjustDialog] = useState(false);
    const [resetKeseluruhan, setResetKeseluruhan] = useState(false);
    const [search, setSearch] = useState('');
    const [first, setFirst] = useState(0); // Halaman pertama
    const [rows, setRows] = useState(10); // Jumlah baris per halaman
    const fileName = `master-daftar-member-${new Date().toISOString().slice(0, 10)}`;
    const [activeFormField, setActiveFormField] = useState(null);
    // PDF
    const [jsPdfPreviewOpen, setjsPdfPreviewOpen] = useState(false);
    const [pdfUrl, setPdfUrl] = useState('');
    const [lazyState, setlazyState] = useState({
        first: 0,
        rows: 10,
        page: 0,
        sortField: null,
        sortOrder: null,
        filters: {}
    });

    const op = useRef(null);

    const onPage = (event) => {
        // Set lazyState from event
        setlazyState(event);

        // Ensure filters remain as strings if they are objects
        if (event.filters) {
            Object.keys(event.filters).forEach((key) => {
                const filterValue = event.filters[key];
                if (typeof filterValue === 'object' && !Array.isArray(filterValue)) {
                    const stringValue = Object.values(filterValue).join('');
                    event.filters[key] = stringValue;
                }
            });
        }
        // Set first and rows for pagination
        setFirst(event.first);
        setRows(event.rows);

        // Load data with updated lazyState
        loadLazyData();
    };

    useEffect(() => {
        setMemberTabelFilt(memberTabel);
    }, [memberTabel, lazyState]);

    useEffect(() => {
        loadLazyData();
    }, [lazyState]);

    const loadLazyData = async () => {
        setLoading(true);
        try {
            const vaTable = await postData(apiEndPointGet, lazyState);
            const jsonMember = vaTable.data;
            setTotalRecords(jsonMember.total_data);
            setMemberTabel(jsonMember.data);
        } catch (error) {
            let e = error?.response?.data || error;
            showError(toast, e?.message || 'Terjadi Kesalahan');
        } finally {
            setLoading(false);
        }
    };
    // ----------------------------------------------------------------------------------------------------------------- Hide Dialog
    const hideDialog = () => {
        setSubmitted(false);
        setDaftarMemberDialog(false);
        setMember([]);
    };
    const hideDeleteMemberDialog = () => {
        setDeleteMemberDialog(false);
    };
    const hidePointMemberDialog = () => {
        setResetPointMemberDialog(false);
    };

    // ------------------------------------------------------------------------------------------------------------------ Toggle
    const toggleDataTableMember = async (event) => {
        // op.current.toggle(event);
        let indeks = null;
        let skipRequest = false;
        switch (event.index) {
            case 1:
                indeks = 2;
                contactPerson1 !== null ? (skipRequest = true) : '';
                break;
            case 2:
                indeks = 3;
                contactPerson1 !== null ? (skipRequest = true) : '';
                break;
            default:
                indeks = 1;
                data !== null ? (skipRequest = true) : '';
                break;
        }

        setActiveIndexMember(event.index ?? 0);
    };

    // -------------------------------------------------------------------------------------------------------------------- Dialog
    const getUrutMember = async () => {
        const response = await postData(apiEndPointGetMember);
        const json = response.data;
        setMember(prev => ({
            ...prev,
            KODE: json
        }));

    }
    const openNew = () => {
        getUrutMember();
        setDaftarMemberDialog(true);
        setIsUpdateMode(false);
    };

    // -------------------------------------------------------------------------------------------------------------------- Func
    const onInputChange = (e, name) => {
        const val = (e.target && e.target.value) || '';
        let _member = { ...member };
        _member[`${name}`] = val;
        setMember(_member);
    };

    const onInputNumberChange = (e, name) => {
        const val = e.value || 0;
        let _member = { ...member };
        _member[`${name}`] = val;
        setMember(_member);
    };

    const saveMember = async (input) => {
        try {
            setLoading(true);
            let response;
            let _member = { ...member };
            if (Array.isArray(input)) {
                response = await postData(apiEndPointKonversi, input);
            } else {
                const endPoint = isUpdateMode ? apiEndPointUpdate : apiEndPointStore;
                response = await postData(endPoint, _member);
            }
            const data = response.data;
            showSuccess(toast, data?.message)
            // Jika data berupa objek dan update, lakukan penyesuaian tabel
            if (!Array.isArray(input) && statusAction === 'update') {
                // Misalnya: update state memberTabel dan reset form
                setMemberTabel([...memberTabel]);
                setMember([]);
            } else {
                // Untuk data array atau penambahan baru, refresh tabel
                loadLazyData();
            }
            setDaftarMemberDialog(false);

        } catch (error) {
            let e = error?.response?.data || error;
            showError(toast, e?.message || 'Terjadi Kesalahan');
        } finally {
            setLoading(false);
        }
    };

    const editMember = (member) => {
        setMember({ ...member });
        setDaftarMemberDialog(true);
        setIsUpdateMode(true);
    };

    const confirmDeleteMember = (member) => {
        setMember(member);
        setDeleteMemberDialog(true);
    };
    const confirmResetPointMember = (member) => {
        setMember(member);
        setResetKeseluruhan(false);
        setResetPointMemberDialog(true);
    };

    const statusMember = async (input) => {
        let requestBody = {
            KODE: input.KODE,
            STATUS: input.STATUS
        };
        try {
            const vaDelete = await postData(apiEndPointStatus, requestBody);
            let data = vaDelete.data;
            showSuccess(toast, data?.message)
            setMember([]);
            setResetPointMemberDialog(false);
            loadLazyData();
        } catch (error) {
            let e = error?.response?.data || error;
            showError(toast, e?.message || 'Terjadi Kesalahan');
        }
    };

    const resetPointMember = async () => {
        let requestBody = {};
        try {
            if (resetKeseluruhan) {
                requestBody = {
                    Kode: "semua"
                };
            } else {
                requestBody = {
                    Kode: member.KODE
                };
            }
            const responsePost = await postData(apiEndPointReset, requestBody);
            let json = responsePost.data;
            showSuccess(toast, json.data?.message || 'Berhasil Reset Point Member');
            loadLazyData();
            setResetPointMemberDialog(false);
        } catch (error) {
            const e = error.response?.data || error;
            showError(toast, e?.message || 'Terjadi Kesalahan');
        }

    }

    const deleteMember = async () => {
        let requestBody = {
            KODE: member.KODE
        };
        try {
            const vaDelete = await postData(apiEndPointDelete, requestBody);
            let data = vaDelete.data;
            showSuccess(toast, data?.message)
            setMember([]);
            setDeleteMemberDialog(false);
            loadLazyData();
        } catch (error) {
            let e = error?.response?.data || error;
            showError(toast, e?.message || 'Terjadi Kesalahan');
        }
    };

    //  Yang Handle Preview
    const btnAdjust = () => {
        if (memberTabel.length == 0 || !memberTabel) {
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

            if (!memberTabelFilt || memberTabelFilt.length === 0) {
                doc.setFont('helvetica', 'normal');
                doc.setFontSize(11);
                doc.text('Data Kosong', doc.internal.pageSize.width / 2, 60 + marginTopInMm - 10, { align: 'center' });
            }

            const userName = await getUserName(await getEmail());

            const judulLaporan = 'Master Daftar Member';
            const periodeLaporan = '';
            await HeaderLaporan({ doc, marginTopInMm, judulLaporan, periodeLaporan });

            const tableData = memberTabelFilt.map((item) => [item.KODE, item.KETJENIS_MEMBER, item.NAMA, item.ALAMAT, item.TELEPON]);

            doc.autoTable({
                startY: 45 + marginTopInMm - 10,
                head: [['KODE.', 'JENIS MEMBER', 'NAMA', 'ALAMAT', 'TELEPON']],
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
                columnStyles: {},
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
        exportToXLSX(memberTabelFilt, 'master-daftar-member.xlsx');
    };

    const confirmUpload = () => {
        document.getElementById('excelFileInput').click();
    };

    const handleFileUpload = (event) => {
        const file = event.target.files[0];
        if (!file) return; // Jika tidak ada file, keluar dari fungsi

        setLoading(true);

        try {
            const reader = new FileReader();

            reader.onload = async (e) => {
                try {
                    // Membaca file sebagai string biner
                    const binaryString = e.target.result;
                    // Membaca workbook dari file Excel
                    const workbook = XLSX.read(binaryString, { type: 'binary' });
                    // Pastikan terdapat sheet di workbook
                    if (!workbook.SheetNames || workbook.SheetNames.length === 0) {
                        toast.current.show({
                            severity: "error",
                            summary: "Error",
                            detail: "Tidak ada sheet yang ditemukan",
                            life: 3000,
                        });
                        return;
                    }

                    // Ambil sheet pertama (atau ganti sesuai nama sheet yang diinginkan)
                    const sheetMember = workbook.SheetNames[0];
                    const workSheetMember = workbook.Sheets[sheetMember];

                    // Ambil header dari file Excel
                    const excelHeader = XLSX.utils.sheet_to_json(workSheetMember, {
                        header: 1,
                        range: 0,
                    })[0];

                    // Header yang diharapkan
                    const expectedHeader = ['NAMA', 'ALAMAT', 'TELEPON', 'KODE', 'EMAIL', 'JENIS_MEMBER', 'POINT_DEBET', 'POINT_KREDIT'];
                    // Cek apakah header sesuai
                    if (!excelHeader || excelHeader.length !== expectedHeader.length || !expectedHeader.every((val, index) => val === excelHeader[index])) {
                        toast.current.show({
                            severity: "error",
                            summary: "Error",
                            detail: "File yang Anda masukkan tidak sesuai",
                            life: 3000,
                        });
                        return;
                    }

                    // Konversi seluruh sheet ke JSON dengan defval untuk sel kosong
                    const jsonDataRekening = XLSX.utils.sheet_to_json(workSheetMember, {
                        range: 1,
                        header: expectedHeader,
                        defval: ""
                    });

                    // Bersihkan data: tetapkan nilai default jika tidak ada data, konversi point ke angka, dan tambahkan index
                    const cleanedJsonDataRekening = jsonDataRekening.map((row, index) => {
                        return {
                            KODE: row.KODE !== undefined ? row.KODE : '',
                            NAMA: row.NAMA !== undefined ? row.NAMA : '',
                            ALAMAT: row.ALAMAT !== undefined ? row.ALAMAT : '',
                            TELEPON: row.TELEPON !== undefined ? row.TELEPON : '',
                            EMAIL: row.EMAIL !== undefined ? row.EMAIL : '',
                            JENIS_MEMBER: row.JENIS_MEMBER !== undefined ? row.JENIS_MEMBER : '',
                            POINT_DEBET: row.POINT_DEBET !== undefined ? Number(row.POINT_DEBET) : 0,
                            POINT_KREDIT: row.POINT_KREDIT !== undefined ? Number(row.POINT_KREDIT) : 0,
                        };
                    });
                    await saveMember(cleanedJsonDataRekening);
                } catch (innerError) {
                    console.error('Error saat memproses file Excel:', innerError);
                } finally {
                    setLoading(false);
                }
            };

            reader.onerror = (err) => {
                console.error('Error saat membaca file:', err);
                setLoading(false);
            };

            reader.readAsBinaryString(file);
        } catch (error) {
            console.error('Error umum:', error);
            setLoading(false);
        }
    };

    // ---------------------------------------------------------------------------------------------------------------- Button
    const leftToolbarTemplate = () => {
        return (
            <React.Fragment>
                <div className="my-2">
                    <Button label="New" icon="pi pi-plus" className="p-button-success mr-2" onClick={openNew} />
                    {/* <Button label="Delete" icon="pi pi-trash" className="p-button-danger" onClick={confirmDeleteSelected} readOnly={!selectedmembers || !selectedmembers.length} /> */}
                </div>
            </React.Fragment>
        );
    };

    const rightToolbarTemplate = () => {
        return (
            <React.Fragment>
                <Button label="Reset Point Seluruh Member" icon="pi pi-trash" className="p-button-danger mr-2" onClick={() => {
                    setResetKeseluruhan(true);
                    setResetPointMemberDialog(true);
                }}></Button>
                <Button label="Download Template" icon="pi pi-download" className="p-button-warning mr-2" onClick={handleTemplate}></Button>
            </React.Fragment>
        );
    };

    const memberDialogFooter = (
        <>
            <input type="file" id="excelFileInput" accept=".xlsx, .xls" style={{ display: 'none' }} onChange={handleFileUpload} />
            <label htmlFor="excelFileInput">
                <Button loading={loading} label="Import Excel" icon="pi pi-external-link" className="p-button-text" onClick={confirmUpload} />
            </label>
            <Button label="Cancel" icon="pi pi-times" className="p-button-text" onClick={hideDialog} />
            <Button label="Save" icon="pi pi-check" className="p-button-text" onClick={saveMember} />
        </>
    );
    const previewMember = () => {
        return (
            <React.Fragment>
                <div className="my-2">
                    <Button label="Preview" icon="pi pi-file-o" outlined className="p-button-secondary p-button-sm mr-2" onClick={btnAdjust} />
                </div>
            </React.Fragment>
        );
    };
    const actionBodyTemplate = (rowData) => {
        return (
            <>
                <Button icon="pi pi-pencil" severity="success" rounded className="mr-2" onClick={() => editMember(rowData)} title="Edit Member" />
                <Button icon="pi pi-user-minus" severity="danger" rounded className="mr-2" onClick={() => confirmResetPointMember(rowData)} title="Reset Point Member" />
                <Button icon="pi pi-trash" severity="warning" rounded onClick={() => confirmDeleteMember(rowData)} title="Hapus Member" />
            </>
        );
    };

    const deleteMemberDialogFooter = (
        <>
            <Button label="No" icon="pi pi-times" className="p-button-text" onClick={hideDeleteMemberDialog} />
            <Button label="Yes" icon="pi pi-check" className="p-button-text" onClick={deleteMember} />
        </>
    );
    const statusMemberDialogFooter = (
        <>
            <Button label="No" icon="pi pi-times" className="p-button-text" onClick={hidePointMemberDialog} />
            <Button label="Yes" icon="pi pi-check" className="p-button-text" onClick={() => resetPointMember()} />
        </>
    );

    // -----------------------------------------------------------------------------------------------------------------< Rekening >
    const [rekeningDialog, setRekeningDialog] = useState(false);
    // Yang Handle Rekening
    const btnRekening = () => {
        setRekeningDialog(true);
    };

    const onRowSelectKode = (event, formField) => {
        const selectedRow = event.data;
        setMember((p) => ({
            ...p,
            REKENING: selectedRow.kode,
            KETREKENING: selectedRow.keterangan
        }));
        setRekeningDialog(false);
    };
    // -----------------------------------------------------------------------------------------------------------------< Member >
    const [memberDialog, setMemberDialog] = useState(false);
    const btnMember = () => {
        setMemberDialog(true);
    };
    const handleMemberData = (memberKode, memberNama) => {
        setMember((prevMember) => ({
            ...prevMember,
            JENIS_MEMBER: memberKode,
            KETJENIS_MEMBER: memberNama
        }));
    };

    const dropdownValues = [
        { name: 'KODE', label: 'm.KODE' },
        { name: 'NAMA', label: 'm.NAMA' }
    ];
    const [defaultOption, setDropdownValue] = useState(null);
    const headerSearch = (
        <div className="flex flex-column md:flex-row md:justify-content-between md:align-items-center">
            <h5 className="m-0"></h5>
            <div className="flex flex-column md:flex-row md:justify-content-between md:align-items-center">
                {/* <Dropdown value={defaultOption} onChange={(e) => setDropdownValue(e.value)} options={dropdownValues} optionLabel="name" placeholder="Pilih Kolom" /> */}
                <span className="block mt-2 md:mt-0 p-input-icon-left">
                    <i className="pi pi-search" />
                    <InputText placeholder="Search" value={search} onChange={(e) => filterPlugins('search', e.target.value)} className="w-full" />
                </span>
            </div>
        </div>
    );

    const filterPlugins = (name, searchVal) => {
        const x = searchVal.length > 0 ? new RegExp(searchVal, 'i') : null;
        let filtered = [];

        if (name == 'search') {
            filtered = memberTabel.filter((d) => (x ? x.test(d.KODE) || x.test(d.JENIS_MEMBER) || x.test(d.NAMA) || x.test(d.ALAMAT) || x.test(d.TELEPON) : []));
            setSearch(searchVal);
        } else {
            if (searchVal == 'all') {
                filtered = memberTabel;
            } else {
                filtered = memberTabel.filter((d) => (x ? x.test(d.KODE) : []));
            }
        }

        setMemberTabelFilt(filtered);
    };

    const onSearch = (value) => {
        let _lazyState = { ...lazyState };
        _lazyState['filters'] = {};
        if (defaultOption != null && defaultOption.label != null) {
            _lazyState['filters'][defaultOption.label] = value;
        }
        onPage(_lazyState);
    };
    const statusTemplate = (rowData) => {
        return <Button label={rowData.STATUS === '1' ? 'TIDAK AKTIF' : 'AKTIF'} className={rowData.STATUS === '1' ? 'p-button-danger' : 'p-button-success'} rounded onClick={() => statusMember(rowData)} />;
    };
    //  Yang Handle Template
    const handleTemplate = () => {
        const filePath = '/template/TemplateMember.xlsx';
        const link = document.createElement('a');
        link.href = filePath;
        link.download = 'TemplateMember.xlsx';
        link.click();
    };
    // -------------------------------------------------------------------------------------------------------------------------- return view
    return (
        <BlockUI
            blocked={loadingPreview}
            template={
                <div className="flex align-items-center justify-content-center flex-column gap-3" style={{ height: '100%' }}>
                    <div className="pi pi-spin pi-spinner" style={{ fontSize: '6rem' }}></div>
                    <p>Loading...</p>
                </ div>
            }
        >
            <div className="grid crud-demo">
                <div className="col-12">
                    <div className="card">
                        <h4>Menu Daftar Member</h4>
                        <hr />
                        <Toast ref={toast} />
                        <Toolbar className="mb-4" start={leftToolbarTemplate} end={rightToolbarTemplate}></Toolbar>
                        <DataTable
                            value={memberTabelFilt}
                            filters={lazyState.filters}
                            header={headerSearch}
                            first={first} // Menggunakan nilai halaman pertama dari state
                            rows={rows} // Menggunakan nilai jumlah baris per halaman dari state
                            onPage={onPage} // Memanggil fungsi onPage saat halaman berubah
                            paginator
                            paginatorTemplate={`FirstPageLink PrevPageLink PageLinks NextPageLink LastPageLink CurrentPageReport RowsPerPageDropdown`}
                            currentPageReportTemplate="Menampilkan {first} - {last} dari {totalRecords} data"
                            totalRecords={totalRecords} // Total number of records
                            size="small"
                            loading={loading}
                            emptyMessage="Data Kosong"
                            onRowsPerPageChange={(e) => setRowsPerPage(e.value)}
                        >
                            <Column headerStyle={{ textAlign: 'center' }} body={statusTemplate} header="STATUS" />
                            <Column headerStyle={{ textAlign: 'center' }} field="KODE" header="KODE"></Column>
                            <Column headerStyle={{ textAlign: 'center' }} field="KETJENIS_MEMBER" header="JENIS"></Column>
                            <Column headerStyle={{ textAlign: 'center' }} field="NAMA" header="NAMA"></Column>
                            <Column headerStyle={{ textAlign: 'center' }} field="ALAMAT" header="ALAMAT"></Column>
                            <Column headerStyle={{ textAlign: 'center' }} field="TELEPON" header="TELEPON"></Column>
                            <Column headerStyle={{ textAlign: 'center' }} field="SISA_POINT" header="SISA POINT"></Column>
                            <Column headerStyle={{ textAlign: 'center' }} header="ACTION" body={actionBodyTemplate}></Column>
                        </DataTable>
                        <Toolbar className="mb-4" start={previewMember}></Toolbar>

                        {/* Dialog Member  */}
                        <Dialog visible={daftarMemberDialog} style={{ width: '75%' }} header="Form Daftar Member " modal className="p-fluid" footer={memberDialogFooter} onHide={hideDialog}>
                            <TabView activeIndex={activeIndexMember} onTabChange={toggleDataTableMember}>
                                <TabPanel header="Data" style={{ width: '100%' }}>
                                    <div>
                                        <div className="formgrid grid">
                                            <div className="field col-6 mb-2 lg:col-6">
                                                <label htmlFor="kode">Kode</label>
                                                <div className="p-inputgroup">
                                                    <InputText value={member.KODE}
                                                        //  onChange={(e) => onInputChange(e, 'KODE')}
                                                        readOnly
                                                    />
                                                </div>
                                            </div>
                                            <div className="field col-6 mb-2 lg:col-6">
                                                <label htmlFor="nama">Nama</label>
                                                <div className="p-inputgroup">
                                                    <InputText id="nama" autoFocus value={member.NAMA} onChange={(e) => onInputChange(e, 'NAMA')} />
                                                </div>
                                            </div>
                                            <div className="field col-6 mb-2 lg:col-6">
                                                <label htmlFor="telepon">Telepon</label>
                                                <div className="p-inputgroup">
                                                    <InputText id="telepon" value={member.TELEPON} onChange={(e) => onInputChange(e, 'TELEPON')} />
                                                </div>
                                            </div>
                                            <div className="field col-6 mb-2 lg:col-6">
                                                <label htmlFor="alamat">Alamat</label>
                                                <div className="p-inputgroup">
                                                    <InputText id="alamat" value={member.ALAMAT} onChange={(e) => onInputChange(e, 'ALAMAT')} />
                                                </div>
                                            </div>
                                            <div className="field col-12 mb-2 lg:col-6">
                                                <label htmlFor="jenis-member">Jenis Member</label>
                                                <div className="p-inputgroup">
                                                    <InputText id="jenisMemberKode" value={member.JENIS_MEMBER} onChange={(e) => onInputChange(e, 'JENIS_MEMBER')} className={classNames({ 'p-invalid': submitted && !member.JENIS_MEMBER })} />
                                                    <Button icon="pi pi-search" className="p-button" onClick={btnMember} />
                                                    <InputText readOnly id="jenisMemberKet" value={member.KETJENIS_MEMBER} />
                                                </div>
                                            </div>
                                            <div className="field col-12 mb-2 lg:col-6">
                                                <label htmlFor="rek-perkiraan">Rekening Perkiraan</label>
                                                <div className="p-inputgroup">
                                                    <InputText readOnly id="rekeningKode" value={member.REKENING} onChange={(e) => onInputChange(e, 'REKENING')} className={classNames({ 'p-invalid': submitted && !member.REKENING })} />
                                                    <Button icon="pi pi-search" className="p-button" onClick={btnRekening} />
                                                    <InputText readOnly id="rekeningKet" value={member.KETREKENING} />
                                                </div>
                                            </div>
                                            <div className="field col-6 mb-2 lg:col-6">
                                                <label htmlFor="plafond1">Plafond1</label>
                                                <div className="p-inputgroup">
                                                    <InputNumber inputStyle={{ textAlign: 'right' }} id="plafond1" value={member.PLAFOND_1} onChange={(e) => onInputNumberChange(e, 'PLAFOND_1')} />
                                                </div>
                                            </div>
                                            <div className="field col-6 mb-2 lg:col-6">
                                                <label htmlFor="plafond2">Plafond2</label>
                                                <div className="p-inputgroup">
                                                    <InputNumber inputStyle={{ textAlign: 'right' }} id="plafond2" value={member.PLAFOND_2} onChange={(e) => onInputNumberChange(e, 'PLAFOND_2')} />
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </TabPanel>
                                <TabPanel header="Contact Person 1" style={{ width: '100%' }}>
                                    <div>
                                        <div className="formgrid grid">
                                            <div className="field col-6 mb-2 lg:col-6">
                                                <label htmlFor="nama">Nama</label>
                                                <div className="p-inputgroup">
                                                    <InputText autoFocus id="nama" value={member.NAMA_CP_1} onChange={(e) => onInputChange(e, 'NAMA_CP_1')} />
                                                </div>
                                            </div>
                                            <div className="field col-6 mb-2 lg:col-6">
                                                <label htmlFor="email">Email</label>
                                                <div className="p-inputgroup">
                                                    <InputText id="email" value={member.EMAIL_CP_1} onChange={(e) => onInputChange(e, 'EMAIL_CP_1')} />
                                                </div>
                                            </div>
                                            <div className="field col-6 mb-2 lg:col-6">
                                                <label htmlFor="telepon">Telepon</label>
                                                <div className="p-inputgroup">
                                                    <InputText id="telepon" value={member.TELEPON_CP_1} onChange={(e) => onInputChange(e, 'TELEPON_CP_1')} />
                                                </div>
                                            </div>
                                            <div className="field col-6 mb-2 lg:col-6">
                                                <label htmlFor="no-ponsel">Nomor Ponsel</label>
                                                <div className="p-inputgroup">
                                                    <InputText id="no-ponsel" value={member.HP_CP_1} onChange={(e) => onInputChange(e, 'HP_CP_1')} />
                                                </div>
                                            </div>
                                            <div className="field col-12 mb-2 lg:col-12">
                                                <label htmlFor="alamat">Alamat</label>
                                                <br />
                                                <InputTextarea style={{ width: '100%' }} id="alamat" value={member.ALAMAT_CP_1} onChange={(e) => onInputChange(e, 'ALAMAT_CP_1')} />
                                            </div>
                                        </div>
                                    </div>
                                </TabPanel>
                                <TabPanel header="Contact Person 2" style={{ width: '100%' }}>
                                    <div>
                                        <div className="formgrid grid">
                                            <div className="field col-6 mb-2 lg:col-6">
                                                <label htmlFor="nama">Nama</label>
                                                <div className="p-inputgroup">
                                                    <InputText autoFocus id="nama" value={member.NAMA_CP_2} onChange={(e) => onInputChange(e, 'NAMA_CP_2')} />
                                                </div>
                                            </div>
                                            <div className="field col-6 mb-2 lg:col-6">
                                                <label htmlFor="email">Email</label>
                                                <div className="p-inputgroup">
                                                    <InputText id="email" value={member.EMAIL_CP_2} onChange={(e) => onInputChange(e, 'EMAIL_CP_2')} />
                                                </div>
                                            </div>
                                            <div className="field col-6 mb-2 lg:col-6">
                                                <label htmlFor="telepon">Telepon</label>
                                                <div className="p-inputgroup">
                                                    <InputText id="telepon" value={member.TELEPON_CP_2} onChange={(e) => onInputChange(e, 'TELEPON_CP_2')} />
                                                </div>
                                            </div>
                                            <div className="field col-6 mb-2 lg:col-6">
                                                <label htmlFor="no-ponsel">Nomor Ponsel</label>
                                                <div className="p-inputgroup">
                                                    <InputText id="no-ponsel" value={member.HP_CP_2} onChange={(e) => onInputChange(e, 'HP_CP_2')} />
                                                </div>
                                            </div>
                                            <div className="field col-12 mb-2 lg:col-12">
                                                <label htmlFor="alamat">Alamat</label>
                                                <br />
                                                <InputTextarea style={{ width: '100%' }} id="alamat" value={member.ALAMAT_CP_2} onChange={(e) => onInputChange(e, 'ALAMAT_CP_2')} />
                                            </div>
                                        </div>
                                    </div>
                                </TabPanel>
                            </TabView>
                        </Dialog>

                        <Member memberDialog={memberDialog} setMemberDialog={setMemberDialog} btnMember={btnMember} handleMemberData={handleMemberData} />
                        <MultipleRekeningCOA formField={activeFormField} setRekeningDialog={setRekeningDialog} onRowSelect={onRowSelectKode} rekeningDialog={rekeningDialog} />
                        <Dialog visible={resetPointMemberDialog} style={{ width: '30%' }} header="Reset Point Member" modal footer={statusMemberDialogFooter} onHide={hidePointMemberDialog}>
                            <div className="flex align-items-center justify-content-center">
                                <i className="pi pi-exclamation-triangle mr-3" style={{ fontSize: '2rem' }} />
                                {member && (
                                    <>
                                        {resetKeseluruhan ? (
                                            <span>
                                                Yakin mereset seluruh point member?
                                            </span>
                                        ) : (
                                            <span>
                                                Yakin mereset point member <strong>{member.KODE}</strong> ?
                                            </span>
                                        )}
                                    </>
                                )}

                            </div>
                        </Dialog>
                        <Dialog visible={deleteMemberDialog} header="Confirm" modal footer={deleteMemberDialogFooter} onHide={hideDeleteMemberDialog}>
                            <div className="flex align-items-center justify-content-center">
                                <i className="pi pi-exclamation-triangle mr-3" style={{ fontSize: '2rem' }} />
                                {member && (
                                    <span>
                                        apakah kamu ingin menghapus  <strong>{member.KODE}</strong>
                                    </span>
                                )}
                            </div>
                        </Dialog>
                    </div>
                </div>
                <AdjustPrintMarginLaporan adjustDialog={adjustDialog} setAdjustDialog={setAdjustDialog} btnAdjust={btnAdjust} handleAdjust={handleAdjust} excel={exportExcel}></AdjustPrintMarginLaporan>
                <Dialog visible={jsPdfPreviewOpen} onHide={() => setjsPdfPreviewOpen(false)} modal style={{ width: '90%', height: '100%' }} header="PDF Preview">
                    <div className="p-dialog-content">
                        <PDFViewer pdfUrl={pdfUrl} fileName={fileName} />
                    </div>
                </Dialog>
            </div>
        </BlockUI>
    );
}
