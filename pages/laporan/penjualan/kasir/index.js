import { useRouter } from 'next/router';
import { Button } from 'primereact/button';
import { Calendar } from 'primereact/calendar';
import { Checkbox } from 'primereact/checkbox';
import { Column } from 'primereact/column';
import { ColumnGroup } from 'primereact/columngroup';
import { DataTable } from 'primereact/datatable';
import { Dialog } from 'primereact/dialog';
import { MultiSelect } from 'primereact/multiselect';
import { InputText } from 'primereact/inputtext';
import { Panel } from 'primereact/panel';
import { Row } from 'primereact/row';
import { Toast } from 'primereact/toast';
import { Toolbar } from 'primereact/toolbar';
import React, { useEffect, useRef, useState } from 'react';
import { exportToXLSX } from '../../../../component/exportXLSX/exportXLSX';
import { convertToISODate, formatDate, formatRibuan, getEmail, getUserName, showError } from '../../../../component/GeneralFunction/GeneralFunction';
import postData from '../../../../lib/Axios';
import { getSessionServerSide } from '../../../../utilities/servertool';
import Gudang from '../../../component/gudang';
import Supervisor from '../../../component/supervisor';
import UserKasir from '../../../component/userKasir';
import PDFViewer from '../../../../component/PDFViewer';
import AdjustPrintMarginLaporan from '../../../component/adjustPrintMarginLaporan';
import jsPDF from 'jspdf';
import { addPageInfo, Footer, HeaderLaporan } from '../../../../component/exportPDF/exportPDF';
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
export default function MasterLapKasir() {
    const apiEndPointGet = '/api/laporan/kasir/get';
    const apiEndPointGetDataByFaktur = '/api/laporan/kasir/getdata_byfaktur';
    const toast = useRef(null);
    const [loadingPreview, setLoadingPreview] = useState(false);
    const [loading, setLoading] = useState(false);
    const [tampilkanDataRetur, setTampilkanDataRetur] = useState(false);
    const [lapKasir, setLapKasir] = useState(null);
    const [lapKasirTabel, setLapKasirTabel] = useState([]);
    const [lapKasirTabelFilt, setLapKasirTabelFilt] = useState([]);
    const [lapKasirTabelDetail, setLapKasirTabelDetail] = useState([]);
    const [lapKasirDialog, setLapKasirDialog] = useState(false);
    const [search, setSearch] = useState('');
    const [caraBayar, setCaraBayar] = useState(["Tunai", "E-Money", "Penukaran Point", "Debit Card BMT NU Ngasem", "Debit Card Bank BSI"]);
    const [pdfUrl, setPdfUrl] = useState('');
    const [jsPdfPreviewOpen, setjsPdfPreviewOpen] = useState(false);
    const [adjustDialog, setAdjustDialog] = useState(false);
    const fileName = `laporan-penjualan-kasir-${new Date().toISOString().slice(0, 10)}`;
    const [totalRecords, setTotalRecords] = useState(0);
    const [first, setFirst] = useState(0); // Halaman pertama
    const [rows, setRows] = useState(10); // Jumlah baris per halaman
    const paymentMethods = [
        { label: 'Tunai', value: 'Tunai' },
        { label: 'Debit Card BMT NU Ngasem', value: 'Debit Card BMT NU Ngasem' },
        { label: 'Debit Card Bank BSI', value: 'Debit Card Bank BSI' },
        { label: 'E-Money', value: 'E-Money' },
        { label: 'Penukaran Point', value: 'Penukaran Point' }
    ];
    const [lazyState, setlazyState] = useState({
        first: 0,
        rows: 10,
        page: 0,
        sortField: null,
        sortOrder: null,
        filters: {}
    });
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
    const [startDate, setStartDate] = useState(new Date());
    const [endDate, setEndDate] = useState(new Date());
    // -----------------------------------------------------------------------------------------------------------------< Handle Calendar >
    const handleStartDateChange = (e) => {
        setStartDate(e.value);
    };
    const handleEndDateChange = (e) => {
        setEndDate(e.value);
    };
    const [resetState, setResetState] = useState(false); // Tambahkan state ini

    useEffect(() => {
        loadLazyData();
    }, [lazyState, resetState]);

    useEffect(() => {
        setLapKasirTabelFilt(lapKasirTabel);
    }, [lapKasirTabel, lazyState]);

    const loadLazyData = async () => {
        setLoading(true);
        try {
            const requestBody = {
                ...lazyState,
                START_DATE: convertToISODate(startDate),
                END_DATE: convertToISODate(endDate),
                GUDANG: lapKasir?.GUDANG || gudangKode,
                KASIR: lapKasir?.USERKASIR || userKasirKode,
                SUPERVISOR: lapKasir?.SUPERVISOR || supervisorKode,
                STATUS: tampilkanDataRetur === 1 ? 1 : 0,
                CARABAYAR: caraBayar
            };
            const vaTable = await postData(apiEndPointGet, requestBody);
            const json = vaTable.data;
            setTotalRecords(json.total_data);
            setLapKasirTabel(json.data);
        } catch (error) {
            let e = error?.response?.data || error;
            showError(toast, e?.message || 'Terjadi Kesalahan');
        } finally {
            setLoading(false);
        }
    };

    const handleCheckboxChange = (e) => {
        setTampilkanDataRetur(e.target.checked ? 1 : 0);
    };

    const handleCaraBayarChange = (e) => {
        const { value, checked } = e.target;

        setCaraBayar((prev) => {
            if (checked) {
                return [...prev, value];
            } else {
                return prev.length > 1 ? prev.filter((item) => item !== value) : prev;
            }
        });
    };

    const reset = () => {
        setLoading(true);
        setStartDate(new Date());
        setEndDate(new Date());
        setLapKasir(null);
        setLapKasirTabel([]);
        setGudangKode('');
        setGudangKet('');
        setUserKasirKode('');
        setUserKasirKet('');
        setSupervisorKode('');
        setSupervisorKet('');
        setTampilkanDataRetur(false);
        setlazyState({
            ...lazyState,
            START_DATE: new Date(),
            END_DATE: new Date(),
            GUDANG: null,
            KASIR: null,
            SUPERVISOR: null,
            filters: {}
        });
        setResetState((prev) => !prev);
        setLoading(false);
    };
    const refresh = () => {
        setLoading(true);
        if (startDate && endDate) {
            const updatedLazyState = {
                ...lazyState,
                START_DATE: startDate,
                END_DATE: endDate,
                GUDANG: lapKasir?.GUDANG || gudangKode,
                KASIR: lapKasir?.KASIR || userKasirKode,
                SUPERVISOR: lapKasir?.SUPERVISOR || supervisorKode
            };

            loadLazyData(updatedLazyState);
        } else {
            loadLazyData(lazyState);
        }
        setLoading(false);
    };

    // -----------------------------------------------------------------------------------------------------------------< Gudang >
    const [gudangDialog, setGudangDialog] = useState(false);
    const [gudangKode, setGudangKode] = useState('');
    const [gudangKet, setGudangKet] = useState('');
    const btnGudang = () => {
        setGudangDialog(true);
    };
    const handleGudangData = (gudangKode, gudangKet) => {
        setGudangKode(gudangKode);
        setGudangKet(gudangKet);
        setLapKasir((prevLapKasir) => ({
            ...prevLapKasir,
            GUDANG: gudangKode
        }));
    };
    // -----------------------------------------------------------------------------------------------------------------< UserKasir >
    const [userKasirDialog, setUserKasirDialog] = useState(false);
    const [userKasirKode, setUserKasirKode] = useState('');
    const [userKasirKet, setUserKasirKet] = useState('');
    const btnUserKasir = () => {
        setUserKasirDialog(true);
    };
    const handleUserKasirData = (userKasirKode, userKasirKet) => {
        setUserKasirKode(userKasirKode);
        setUserKasirKet(userKasirKet);
        setLapKasir((prevLapKasir) => ({
            ...prevLapKasir,
            USERKASIR: userKasirKode
        }));
    };
    // -----------------------------------------------------------------------------------------------------------------< Supervisor >
    const [supervisorDialog, setSupervisorDialog] = useState(false);
    const [supervisorKode, setSupervisorKode] = useState('');
    const [supervisorKet, setSupervisorKet] = useState('');
    const btnSupervisor = () => {
        setSupervisorDialog(true);
    };
    const handleSupervisorData = (supervisorKode, supervisorKet) => {
        setSupervisorKode(supervisorKode);
        setSupervisorKet(supervisorKet);
        setLapKasir((prevLapKasir) => ({
            ...prevLapKasir,
            SUPERVISOR: supervisorKode
        }));
    };

    // -------------------------------------------------------------------------------------------------------------------- Func
    const detail = async (rowData) => {
        const { FAKTUR } = rowData;

        setLapKasirDialog(true);
        try {
            let requestBody = {
                FAKTUR: FAKTUR
            };
            const vaTable = await postData(apiEndPointGetDataByFaktur, requestBody);
            const json = vaTable.data;
            setLapKasirTabelDetail(json.data);
        } catch (error) {
            let e = error?.response?.data || error;
            showError(toast, e?.message || 'Terjadi Kesalahan');
        } finally {
            setLoading(false);
        }
    };
    // ---------------------------------------------------------------------------------------------------------------- Button
    const filterPlugins = (name, searchVal) => {
        const x = searchVal.length > 0 ? new RegExp(searchVal, 'i') : null;
        let filtered = [];

        if (name == 'search') {
            filtered = lapKasirTabel.filter((d) =>
                x
                    ? x.test(d.TGL) ||
                    x.test(d.FAKTUR) ||
                    x.test(d.GUDANG) ||
                    x.test(d.TOTAL) ||
                    x.test(d.TOTALHPP) ||
                    x.test(d.DISCOUNT) ||
                    x.test(d.PPN) ||
                    x.test(d.SELISIHJUAL) ||
                    x.test(d.PPN) ||
                    x.test(d.SELISIHJUAL) ||
                    x.test(d.KASIR) ||
                    x.test(d.SPV)
                    : []
            );
            setSearch(searchVal);
        } else {
            if (searchVal == 'all') {
                filtered = lapKasirTabel;
            } else {
                filtered = lapKasirTabel.filter((d) => (x ? x.test(d.FAKTUR) : []));
            }
        }

        setLapKasirTabelFilt(filtered);
    };

    const headerSearch = (
        <div className="flex flex-column md:flex-row md:justify-content-between md:align-items-center">
            <h5 className="m-0"></h5>
            <div className="flex flex-column md:flex-row md:justify-content-between md:align-items-center">
                {/* <Dropdown value={defaultOption} onChange={(e) => setDropdownValue(e.value)} options={dropdownValues} optionLabel="label" placeholder="Pilih Kolom" /> */}
                <span className="block mt-2 md:mt-0 p-input-icon-left">
                    <i className="pi pi-search" />
                    <InputText placeholder="Search" value={search} onChange={(e) => filterPlugins('search', e.target.value)} className="w-full" />
                </span>
            </div>
        </div>
    );

    const actionBodyTemplate = (rowData) => {
        return (
            <>
                <Button icon="pi pi-file" severity="warning" rounded className="mr-2" onClick={() => detail(rowData)} />
            </>
        );
    };

    const footernya = () => {
        return (
            <React.Fragment>
                {/* <div className="my-2">
                    <Button label="Batal" icon="pi pi-times" outlined className="p-button-secondary p-button-sm mr-2"/>
                </div> */}
                <div className="my-2 flex gap-2">
                    <Button label="Preview" outlined className="p-button-secondary p-button-sm mr-2" onClick={btnAdjust} />

                    {/* <Button label="Export Excel" icon="pi pi-print" outlined className="p-button-secondary p-button-sm mr-2" onClick={exportExcel} /> */}
                    {/* <Button label="Preview" outlined className="p-button-secondary p-button-sm mr-2" onClick={btnAdjust} /> */}
                </div>
            </React.Fragment>
        );
    };

    const totData = lapKasirTabelFilt.length;
    const totTotal = lapKasirTabelFilt.reduce((accumulator, item) => accumulator + (parseFloat(item.TOTAL) || 0), 0);
    const totPoint = lapKasirTabelFilt.reduce((accumulator, item) => accumulator + (parseFloat(item.POINT) || 0), 0);
    const totDiscount = lapKasirTabelFilt.reduce((accumulator, item) => accumulator + (parseFloat(item.DISCOUNT) || 0), 0);
    const totDonasi = lapKasirTabelFilt.reduce((accumulator, item) => accumulator + (parseFloat(item.DONASI) || 0), 0);
    const totalSetelahDiskon = totTotal - totDiscount;
    const totalBersih = totalSetelahDiskon + totDonasi;

    let footerGroup = (
        <ColumnGroup>
            <Row>
                <Column headerStyle={{ textAlign: 'center' }} footer="Total:" colSpan={4} footerStyle={{ textAlign: 'right' }} />
                <Column headerStyle={{ textAlign: 'center' }} colSpan={1} footer={`${totData.toLocaleString()} Penjualan`} />
                <Column headerStyle={{ textAlign: 'center' }} colSpan={1} footer={`Rp. ${formatRibuan(totTotal)}`} footerStyle={{ textAlign: 'right' }} />
                <Column headerStyle={{ textAlign: 'center' }} colSpan={1} footer={`Rp. ${formatRibuan(totPoint)}`} footerStyle={{ textAlign: 'right' }} />
                <Column headerStyle={{ textAlign: 'center' }} colSpan={1} footer={`Rp. ${formatRibuan(totDiscount)}`} footerStyle={{ textAlign: 'right' }} />
                <Column headerStyle={{ textAlign: 'center' }} colSpan={1} footer={`Rp. ${formatRibuan(totDonasi)}`} footerStyle={{ textAlign: 'right' }} />
                <Column headerStyle={{ textAlign: 'center' }} colSpan={3} />
            </Row>
            <Row>
                <Column footer="Total - Discount:" colSpan={4} footerStyle={{ textAlign: 'right' }} />
                <Column colSpan={1} footer={`Rp. ${formatRibuan(totalSetelahDiskon)}`} />
                <Column footer="" />
                <Column footer="" />
                <Column footer="" />
                <Column footer="" />
            </Row>
            <Row>
                <Column footer="Total Bersih:" colSpan={4} footerStyle={{ textAlign: 'right' }} />
                <Column colSpan={1} footer={`Rp. ${formatRibuan(totalBersih)}`} />
                <Column footer="" />
                <Column footer="" />
                <Column footer="" />
                <Column footer="" />
            </Row>
        </ColumnGroup>
    );

    // ---------------------------------------------------------------------< Handle Excel >
    const exportExcel = () => {
        exportToXLSX(lapKasirTabelFilt, 'laporan-penjualan-kasir.xlsx');
    };

    const btnAdjust = () => {
        if (lapKasirTabelFilt.length == 0 || !lapKasirTabelFilt) {
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
            setLoadingPreview(true);
            const defectaPDF = lapKasirTabelFilt ? JSON.parse(JSON.stringify(lapKasirTabelFilt)) : [];

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

            if (!defectaPDF || defectaPDF.length === 0) {
                // If the table is empty, add a message to the PDF
                doc.setFont('helvetica', 'normal');
                doc.setFontSize(11);
                doc.text('Data Kosong', doc.internal.pageSize.width / 2, 60 + marginTopInMm - 10, { align: 'center' });

                // You can also add any other relevant information or styling for an empty table
            }

            const userName = await getUserName(await getEmail());

            const judulLaporan = 'Laporan Penjualan Kasir';
            const periodeLaporan = 'Antara Tanggal ' + formatDate(startDate) + 's.d ' + formatDate(endDate);
            await HeaderLaporan({ doc, marginTopInMm, judulLaporan, periodeLaporan });

            const tableData = defectaPDF.map((item) => [
                item.NO,
                item.TGL,
                item.FAKTUR,
                item.GUDANG,
                item.CARABAYAR === 'Tunai' || item.CARABAYAR === 'Penukaran Point'
                    ? item.CARABAYAR
                    : `${item.CARABAYAR} - ${item.TIPEBAYAR ?? ''}`,
                parseInt(item.TOTAL).toLocaleString(),
                parseInt(item.POINT).toLocaleString(),
                parseInt(item.DISCOUNT).toLocaleString(),
                parseInt(item.DONASI).toLocaleString(),
                item.KASIR
            ]);

            tableData.push([
                '',
                '',
                '',
                'Total Items : ',
                totData + ' Penjualan',
                parseInt(totTotal).toLocaleString(),
                parseInt(totPoint).toLocaleString(),
                parseInt(totDiscount).toLocaleString(),
                parseInt(totDonasi).toLocaleString()
            ]);
            tableData.push([
                '',
                '',
                '',
                'Total - Discount : ',
                parseInt(totalSetelahDiskon).toLocaleString(),
                '',
                '',
                '',
                ''
            ]);
            tableData.push([
                '',
                '',
                '',
                'Total Bersih : ',
                parseInt(totalBersih).toLocaleString(),
                '',
                '',
                '',
                ''
            ]);
            doc.autoTable({
                startY: 45 + marginTopInMm - 10,
                head: [['NO.', 'TANGGAL', 'FAKTUR', 'GUDANG', 'CARA BAYAR', 'TOTAL', 'POINT', 'DISCOUNT', 'DONASI', 'KASIR']],
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
                    1: { halign: 'center' },
                    5: { halign: 'right' },
                    6: { halign: 'right' },
                    7: { halign: 'right' }
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
                        <h4>Laporan Penjualan Kasir</h4>
                        <hr />
                        <Toast ref={toast} />
                        <Panel header="Filter" toggleable>
                            <div className="flex flex-column w-fullsss gap-4">
                                {/* Baris 1 - Input Gudang, Kasir, SPV */}
                                <div className="flex gap-4 w-full">
                                    <div className="flex gap-2 flex-column w-full">
                                        <label htmlFor="gudang">Gudang</label>
                                        <div className="p-inputgroup w-full">
                                            <InputText readOnly id="gudang_kode" value={gudangKode} className="w-6rem" />
                                            <Button icon="pi pi-search" className="p-button" onClick={btnGudang} />
                                            <InputText readOnly id="ket-Gudang" value={gudangKet} />
                                        </div>
                                    </div>

                                    <div className="flex gap-2 flex-column w-full">
                                        <label htmlFor="userKasir">Kasir</label>
                                        <div className="p-inputgroup w-full">
                                            <InputText readOnly id="userKasir_kode" value={userKasirKode} className="w-6rem" />
                                            <Button icon="pi pi-search" className="p-button" onClick={btnUserKasir} />
                                            <InputText readOnly id="ket-UserKasir" value={userKasirKet} />
                                        </div>
                                    </div>

                                    <div className="flex gap-2 flex-column w-full">
                                        <label htmlFor="supervisor">SPV</label>
                                        <div className="p-inputgroup w-full">
                                            <InputText readOnly id="supervisor_kode" value={supervisorKode} className="w-6rem" />
                                            <Button icon="pi pi-search" className="p-button" onClick={btnSupervisor} />
                                            <InputText readOnly id="ket-Supervisor" value={supervisorKet} />
                                        </div>
                                    </div>
                                </div>

                                {/* Baris 3 - Periode dan Action */}
                                <div className="flex gap-4 align-items-center w-full">
                                    <div className="flex gap-2 flex-column w-full">
                                        <label htmlFor="faktur">Periode</label>
                                        <div className="p-inputgroup">
                                            <Calendar
                                                value={lapKasir?.START_DATE || startDate}
                                                onChange={handleStartDateChange}
                                                dateFormat="dd-mm-yy"
                                                placeholder="Start Date"
                                                readOnlyInput
                                            />
                                            <span className="p-inputgroup-addon">s/d</span>
                                            <Calendar
                                                value={lapKasir?.END_DATE || endDate}
                                                onChange={handleEndDateChange}
                                                dateFormat="dd-mm-yy"
                                                placeholder="End Date"
                                                readOnlyInput
                                            />
                                        </div>
                                    </div>
                                    {/* Baris 2 - Metode Pembayaran */}
                                    {/* <div className="w-full flex flex-column gap-2">
                                        <label>Metode Pembayaran</label>
                                        <div className="flex flex-wrap gap-5">
                                            <div className="flex items-center">
                                                <Checkbox inputId="tunai" value="Tunai" checked={caraBayar.includes("Tunai")} onChange={handleCaraBayarChange} />
                                                <label htmlFor="tunai" className="ml-2">Tunai</label>
                                            </div>
                                            <div className="flex items-center">
                                                <Checkbox inputId="debitcard" value="Debit Card" checked={caraBayar.includes("Debit Card")} onChange={handleCaraBayarChange} />
                                                <label htmlFor="debitcard" className="ml-2">Debit</label>
                                            </div>
                                            <div className="flex items-center">
                                                <Checkbox inputId="emoney" value="E-Money" checked={caraBayar.includes("E-Money")} onChange={handleCaraBayarChange} />
                                                <label htmlFor="emoney" className="ml-2">E-Money</label>
                                            </div>
                                            <div className="flex items-center">
                                                <Checkbox inputId="point" value="Point" checked={caraBayar.includes("Point")} onChange={handleCaraBayarChange} />
                                                <label htmlFor="point" className="ml-2">Penukaran Point</label>
                                            </div>
                                        </div>
                                    </div> */}
                                    <div className="w-full flex flex-column gap-2">
                                        <label>Metode Pembayaran</label>
                                        <div className="flex flex-wrap gap-5">
                                            <MultiSelect
                                                value={caraBayar}
                                                options={paymentMethods}
                                                onChange={(e) => setCaraBayar(e.value)}
                                                placeholder="Pilih Metode Pembayaran"
                                                display="chip"
                                            />
                                        </div>
                                    </div>

                                    <div className="flex flex-column gap-3">
                                        <div className="flex items-center">
                                            <Checkbox
                                                inputId="tampilDataRetur"
                                                checked={tampilkanDataRetur === 1}
                                                onChange={handleCheckboxChange}
                                            />
                                            <label htmlFor="tampilDataRetur" className="ml-2">Tampil Data Retur</label>
                                        </div>

                                        <div className="flex gap-2">
                                            <Button
                                                label="Refresh"
                                                icon="pi pi-refresh"
                                                className="p-button-primary w-full"
                                                onClick={loadLazyData}
                                            />
                                            <Button
                                                label="Reset"
                                                icon="pi pi-replay"
                                                className="p-button-danger w-full"
                                                onClick={reset}
                                            />
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </Panel>

                        <DataTable
                            value={lapKasirTabelFilt}
                            filters={lazyState.filters}
                            header={headerSearch}
                            first={first} // Menggunakan nilai halaman pertama dari state
                            rows={rows} // Menggunakan nilai jumlah baris per halaman dari state
                            onPage={onPage} // Memanggil fungsi onPage saat halaman berubah
                            paginator
                            paginatorTemplate="FirstPageLink PrevPageLink PageLinks NextPageLink LastPageLink CurrentPageReport RowsPerPageDropdown"
                            currentPageReportTemplate="Menampilkan {first} - {last} dari {totalRecords} data"
                            totalRecords={totalRecords}
                            size="small"
                            loading={loading}
                            emptyMessage="Data Kosong"
                            onRowsPerPageChange={(e) => setRowsPerPage(e.value)}
                            footerColumnGroup={footerGroup}
                        >
                            <Column headerStyle={{ textAlign: 'center' }} field="NO" header="NO."></Column>
                            <Column headerStyle={{ textAlign: 'center' }} field="TGL" header="TANGGAL"></Column>
                            <Column headerStyle={{ textAlign: 'center' }} field="FAKTUR" header="FAKTUR"></Column>
                            <Column headerStyle={{ textAlign: 'center' }} field="GUDANG" header="GUDANG"></Column>
                            <Column
                                headerStyle={{ textAlign: 'center' }}
                                field="CARABAYAR"
                                header="CARA BAYAR"
                                body={(rowData) => {
                                    return (rowData.CARABAYAR === 'Tunai' || rowData.CARABAYAR === 'Penukaran Point')
                                        ? rowData.CARABAYAR
                                        : `${rowData.CARABAYAR} - ${rowData.TIPEBAYAR ?? ''}`;
                                }}
                            />
                            <Column
                                headerStyle={{ textAlign: 'center' }}
                                field="TOTAL"
                                align={'right'}
                                header="TOTAL"
                                body={(rowData) => {
                                    const value = rowData.TOTAL ? parseInt(rowData.TOTAL).toLocaleString() : 0;
                                    return value;
                                }}
                                bodyStyle={{ textAlign: 'right' }}
                            ></Column>
                            <Column
                                headerStyle={{ textAlign: 'center' }}
                                field="POINT"
                                align={'right'}
                                header="POINT"
                                body={(rowData) => {
                                    const value = rowData.POINT ? parseInt(rowData.POINT).toLocaleString() : 0;
                                    return value;
                                }}
                                bodyStyle={{ textAlign: 'right' }}
                            ></Column>
                            <Column
                                field="DISCOUNT"
                                align={'right'}
                                header="DISCOUNT"
                                body={(rowData) => {
                                    const value = rowData.DISCOUNT ? parseInt(rowData.DISCOUNT).toLocaleString() : 0;
                                    return value;
                                }}
                                bodyStyle={{ textAlign: 'right' }}
                            ></Column>
                            <Column
                                field="DONASI"
                                align={'right'}
                                header="DONASI"
                                body={(rowData) => {
                                    const value = rowData.DONASI ? parseInt(rowData.DONASI).toLocaleString() : 0;
                                    return value;
                                }}
                                bodyStyle={{ textAlign: 'right' }}
                            ></Column>
                            <Column headerStyle={{ textAlign: 'center' }} header="ACTION" body={actionBodyTemplate} bodyStyle={{ textAlign: 'center' }}></Column>
                        </DataTable>
                        <Toolbar className="mb-2" start={footernya}></Toolbar>

                        <Gudang gudangDialog={gudangDialog} setGudangDialog={setGudangDialog} btnGudang={btnGudang} handleGudangData={handleGudangData} />
                        <UserKasir userKasirDialog={userKasirDialog} setUserKasirDialog={setUserKasirDialog} btnUserKasir={btnUserKasir} handleUserKasirData={handleUserKasirData} />
                        <Supervisor supervisorDialog={supervisorDialog} setSupervisorDialog={setSupervisorDialog} btnSupervisor={btnSupervisor} handleSupervisorData={handleSupervisorData} />

                        <Dialog visible={lapKasirDialog} style={{ width: '75%' }} header="Detail Penjualan " modal className="p-fluid" onHide={() => setLapKasirDialog(false)}>
                            <DataTable
                                value={lapKasirTabelDetail}
                                lazy
                                rows={10}
                                className="datatable-responsive"
                                first={lazyState.first}
                                totalRecords={totalRecords}
                                onPage={onPage}
                                loading={loading}
                                size="small"
                            >
                                <Column headerStyle={{ textAlign: 'center' }} field="KODE" header="KODE"></Column>
                                <Column headerStyle={{ textAlign: 'center' }} field="NAMA" header="NAMA BARANG"></Column>
                                <Column headerStyle={{ textAlign: 'center' }} field="QTY" header="QTY"></Column>
                                <Column headerStyle={{ textAlign: 'center' }} field="SATUAN" header="SATUAN"></Column>
                                <Column headerStyle={{ textAlign: 'center' }} field="DISCOUNT"
                                    body={(rowData) => {
                                        const value = rowData.DISCOUNT ? parseInt(rowData.DISCOUNT).toLocaleString() : 0;
                                        return value;
                                    }}
                                    header="DISC %"></Column>
                                <Column
                                    headerStyle={{ textAlign: 'center' }}
                                    field="JUMLAH"
                                    header="SUBTOTAL"
                                    body={(rowData) => {
                                        const value = rowData.JUMLAH ? parseInt(rowData.JUMLAH).toLocaleString() : 0;
                                        return value;
                                    }}
                                    bodyStyle={{ textAlign: 'right' }}
                                ></Column>
                            </DataTable>
                        </Dialog>

                        <AdjustPrintMarginLaporan adjustDialog={adjustDialog} setAdjustDialog={setAdjustDialog} btnAdjust={btnAdjust} handleAdjust={handleAdjust} excel={exportExcel}></AdjustPrintMarginLaporan>
                        <Dialog visible={jsPdfPreviewOpen} onHide={() => setjsPdfPreviewOpen(false)} modal style={{ width: '90%', height: '100%' }} header="PDF Preview">
                            <div className="p-dialog-content">
                                <PDFViewer pdfUrl={pdfUrl} fileName={fileName} />
                            </div>
                        </Dialog>
                    </div>
                </div>
            </div>
        </BlockUI>
    );
}
