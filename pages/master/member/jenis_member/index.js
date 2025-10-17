import { Button } from 'primereact/button';
import { Column } from 'primereact/column';
import { DataTable } from 'primereact/datatable';
import { Dialog } from 'primereact/dialog';
import { InputText } from 'primereact/inputtext';
import { Toast } from 'primereact/toast';
import { Toolbar } from 'primereact/toolbar';
import React, { useEffect, useRef, useState } from 'react';
import postData from '../../../../lib/Axios';
import { getSessionServerSide } from '../../../../utilities/servertool';
import jsPDF from 'jspdf';
import { getEmail, getUserName, showError, showSuccess } from '../../../../component/GeneralFunction/GeneralFunction';
import { Footer, HeaderLaporan, addPageInfo } from '../../../../component/exportPDF/exportPDF';
import { exportToXLSX } from '../../../../component/exportXLSX/exportXLSX';
import AdjustPrintMarginLaporan from '../../../component/adjustPrintMarginLaporan';
import PDFViewer from '../../../../component/PDFViewer';
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
export default function member() {
    // API READ
    const apiEndPointGet = '/api/jenis_member/get';
    // API STORE
    const apiEndPointStore = '/api/jenis_member/store';
    // API UPDATE
    const apiEndPointUpdate = '/api/jenis_member/update';
    // API DELETE
    const apiEndPointDelete = '/api/jenis_member/delete';

    const toast = useRef(null);
    const [loading, setLoading] = useState(false);
    const [totalRecords, setTotalRecords] = useState(0);
    const [isUpdateMode, setIsUpdateMode] = useState(false);
    const [deleteMemberDialog, setDeleteMemberDialog] = useState(false);
    const [member, setMember] = useState([]);
    const [memberDialog, setMemberDialog] = useState(false);
    const [memberTabel, setMemberTabel] = useState([]);
    const [memberTabelFilt, setMemberTabelFilt] = useState([]);
    const [adjustDialog, setAdjustDialog] = useState(false);
    const [search, setSearch] = useState('');
    const [loadingPreview, setLoadingPreview] = useState(false);
    const fileName = `master-jenis-member-${new Date().toISOString().slice(0, 10)}`;
    // PDF
    const [jsPdfPreviewOpen, setjsPdfPreviewOpen] = useState(false);
    const [pdfUrl, setPdfUrl] = useState('');
    //  ------------------------------------------------------------------------------------------------------- Preparation
    const [lazyState, setlazyState] = useState({
        first: 0,
        rows: 10,
        page: 0,
        sortField: null,
        sortOrder: null,
        filters: {}
    });

    const onPage = (event) => {
        setlazyState(event);
    };

    useEffect(() => {
        loadLazyData();
    }, [lazyState]);

    useEffect(() => {
        setMemberTabelFilt(memberTabel);
    }, [memberTabel, lazyState]);

    const refreshTabel = () => {
        let getLazyState = { ...lazyState };
        setlazyState(getLazyState);
    };

    const loadLazyData = async () => {
        setLoading(true);
        try {
            const vaTable = await postData(apiEndPointGet, lazyState);
            const json = vaTable.data;
            setTotalRecords(json.total_data);
            setMemberTabel(json.data);
        } catch (error) {
            let e = error?.response?.data || error;
            showError(toast, e?.message || 'Terjadi Kesalahan');
        } finally {
            setLoading(false);
        }
    };
    // -------------------------------------------------------------------------------------------------------------------- Dialog
    const openNew = () => {
        setMember([]);

        setMemberDialog(true);
        setIsUpdateMode(false);
    };

    // ----------------------------------------------------------------------------------------------------------------- Hide Dialog
    const hideDialog = () => {
        setMemberDialog(false);
    };
    const hideDeleteMemberDialog = () => {
        setDeleteMemberDialog(false);
    };

    // -------------------------------------------------------------------------------------------------------------------- Func
    const onInputChange = (e, name) => {
        const val = (e.target && e.target.value) || '';
        let _member = { ...member };
        _member[`${name}`] = val;

        setMember(_member);
    };
    const saveMember = async (e) => {
        setLoading(true);
        let _memberTabel = [...memberTabel];
        let _member = { ...member };

        try {
            let endPoint;
            if (isUpdateMode) {
                endPoint = apiEndPointUpdate;
            } else {
                endPoint = apiEndPointStore;
            }
            const vaTable = await postData(endPoint, _member);
            let data = vaTable.data;
            showSuccess(toast, data?.message)
            if (isUpdateMode) {
                setMemberTabel(_memberTabel);
                setMember([]);
                refreshTabel();
            } else {
                refreshTabel();
            }
            setMemberDialog(false);
        } catch (error) {
            let e = error?.response?.data || error;
            showError(toast, e?.message || 'Terjadi Kesalahan');
        } finally {
            setLoading(false);
        }
    };

    const editMember = (member) => {
        setMember({ ...member });
        setMemberDialog(true);
        setIsUpdateMode(true);
    };

    const confirmDeleteMember = (member) => {
        setMember(member);
        setDeleteMemberDialog(true);
    };

    const deleteMember = async () => {
        let requestBody = {
            KODE: member.KODE
        };
        try {
            const vaTable = await postData(apiEndPointDelete, requestBody);
            let data = vaTable.data;
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
            const memberTabelPDF = memberTabelFilt ? JSON.parse(JSON.stringify(memberTabelFilt)) : [];
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

            if (!memberTabelPDF || memberTabelPDF.length === 0) {
                doc.setFont('helvetica', 'normal');
                doc.setFontSize(11);
                doc.text('Data Kosong', doc.internal.pageSize.width / 2, 60 + marginTopInMm - 10, { align: 'center' });
            }

            const userName = await getUserName(await getEmail());

            const judulLaporan = 'Master Jenis Member';
            const periodeLaporan = '';
            await HeaderLaporan({ doc, marginTopInMm, judulLaporan, periodeLaporan });

            const tableData = memberTabelPDF.map((item) => [item.KODE, item.KETERANGAN]);

            doc.autoTable({
                startY: 45 + marginTopInMm - 10,
                head: [[' KODE', 'KETERANGAN']],
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
        exportToXLSX(memberTabelAll, 'master-jenis-member.xlsx');
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

    const previewMember = () => {
        return (
            <React.Fragment>
                <div className="my-2">
                    <Button label="Preview" icon="pi pi-file-o" outlined className="p-button-secondary p-button-sm mr-2" onClick={btnAdjust} />
                </div>
            </React.Fragment>
        );
    };
    const memberDialogFooter = (
        <>
            <Button label="Cancel" icon="pi pi-times" className="p-button-text" onClick={hideDialog} />
            <Button label="Save" icon="pi pi-check" className="p-button-text" onClick={saveMember} />
        </>
    );

    const actionBodyTemplate = (rowData) => {
        return (
            <>
                <Button icon="pi pi-pencil" severity="success" rounded className="mr-2" onClick={() => editMember(rowData)} />
                <Button icon="pi pi-trash" severity="warning" rounded onClick={() => confirmDeleteMember(rowData)} />
            </>
        );
    };

    const deleteMemberDialogFooter = (
        <>
            <Button label="No" icon="pi pi-times" className="p-button-text" onClick={hideDeleteMemberDialog} />
            <Button label="Yes" icon="pi pi-check" className="p-button-text" onClick={deleteMember} />
        </>
    );

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
            filtered = memberTabel.filter((d) => (x ? x.test(d.KODE) || x.test(d.KETERANGAN) : []));
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
                        <h4>Menu Jenis Member</h4>
                        <hr />
                        <Toast ref={toast} />
                        <Toolbar className="mb-4" left={leftToolbarTemplate}></Toolbar>

                        <DataTable
                            value={memberTabelFilt}
                            size="small"
                            lazy
                            dataKey="KODE"
                            paginator
                            rows={10}
                            className="datatable-responsive"
                            first={lazyState.first}
                            totalRecords={totalRecords}
                            onPage={onPage}
                            loading={loading}
                            paginatorTemplate="FirstPageLink PrevPageLink PageLinks NextPageLink LastPageLink CurrentPageReport RowsPerPageDropdown"
                            currentPageReportTemplate="Menampilkan {first} - {last} dari {totalRecords} data"
                            header={headerSearch}
                            filters={lazyState.filters}
                        >
                            <Column headerStyle={{ textAlign: 'center' }} field="KODE" header="KODE"></Column>
                            <Column headerStyle={{ textAlign: 'center' }} field="KETERANGAN" header="KETERANGAN"></Column>
                            <Column headerStyle={{ textAlign: 'center' }} header="ACTION" body={actionBodyTemplate}></Column>
                        </DataTable>
                        <Toolbar className="mb-4" left={previewMember}></Toolbar>

                        {/* Dialog Member */}
                        <Dialog visible={memberDialog} header="Tambah Member" modal className="p-fluid" footer={memberDialogFooter} onHide={hideDialog}>
                            <div className="formgrid grid">
                                <div className="field col-12 mb-2 lg:col-12">
                                    <label htmlFor="kode">Kode</label>
                                    <div className="p-inputgroup">
                                        <InputText autoFocus id="kode" value={member.KODE} onChange={(e) => onInputChange(e, 'KODE')} readOnly={isUpdateMode} />
                                    </div>
                                </div>
                                <div className="field col-12 mb-2 lg:col-12">
                                    <label htmlFor="keterangan">Keterangan</label>
                                    <InputText id="keterangan" value={member.KETERANGAN} onChange={(e) => onInputChange(e, 'KETERANGAN')} required />
                                </div>
                            </div>
                        </Dialog>
                        <Dialog visible={deleteMemberDialog} header="Confirm" modal footer={deleteMemberDialogFooter} onHide={hideDeleteMemberDialog}>
                            <div className="flex align-items-center justify-content-center">
                                <i className="pi pi-exclamation-triangle mr-3" style={{ fontSize: '2rem' }} />
                                {member && (
                                    <span>
                                        Yakin ingin menghapus data <strong>{member.KODE}</strong> ?
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
