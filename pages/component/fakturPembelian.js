import { Column } from 'primereact/column';
import { DataTable } from 'primereact/datatable';
import { Dialog } from 'primereact/dialog';
import { Dropdown } from 'primereact/dropdown';
import { InputText } from 'primereact/inputtext';
import React, { useEffect, useRef, useState } from 'react';
import postData from '../../lib/Axios';
import { formatDateTable, showError } from '../../component/GeneralFunction/GeneralFunction';

export default function FakturPembelian({ fakturPembelianDialog, setFakturPembelianDialog, btnFakturPembelian, handleFakturPembelianData }) {
    const apiEndPointGetFakturPembelian = '/api/rtnpembelian_faktur/get_fakturpembelian';

    const [totalRecords, setTotalRecords] = useState(0);
    const [loading, setLoading] = useState(false);
    const [fakturPembelianTabel, setFakturPembelianTabel] = useState(null);
    const [defaultOption, setDropdownValue] = useState(null);
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
        setlazyState(event);
    };

    // useEffect(() => {
    //     loadLazyData();
    // }, [lazyState]);

    // useEffect(() => {
    //     toggleFakturPembelian();
    // }, [btnFakturPembelian]);

    useEffect(() => {
        // Cek apakah dialog produk ditampilkan dan tombol produk diklik
        if (fakturPembelianDialog && btnFakturPembelian) {
            toggleFakturPembelian();
        }
    }, [fakturPembelianDialog, btnFakturPembelian, lazyState]);

    // -----------------------------------------------------------------------------------------------------------------< FakturPembelian >
    const dropdownValues = [
        { name: 'FAKTUR', label: 'FAKTUR' },
        { name: 'SUPPLIER', label: 'KODE SUPPLIER' }
    ];
    const [timer, setTimer] = useState(null);
    const inputChanged = (e) => {
        clearTimeout(timer);

        const newTimer = setTimeout(() => {
            let _lazyState = { ...lazyState };
            _lazyState['filters'] = { ...lazyState.filters }; // Copy existing filters
            // if (selectedSesi) {
            //     // Add selectedSesi to filters if available
            //     _lazyState.filters["selectedSesi"] = selectedSesi;
            // }
            if (defaultOption != null && defaultOption.name != null) {
                _lazyState['filters'][defaultOption.name] = e;
            }
            onPage(_lazyState);
        }, 500);

        setTimer(newTimer);
    };
    const headerFakturPembelian = (
        <div className="flex flex-column md:flex-row md:justify-content-between md:align-items-center">
            <h5 className="m-0"> </h5>
            <div className="flex flex-column md:flex-row md:justify-content-between md:align-items-center">
                <Dropdown value={defaultOption} onChange={(e) => setDropdownValue(e.value)} options={dropdownValues} optionLabel="label" placeholder="Pilih Kolom" />
                &nbsp;
                <span className="block mt-2 md:mt-0 p-input-icon-left">
                    <i className="pi pi-search" />
                    <InputText type="search" onInput={(e) => inputChanged(e.target.value)} placeholder="Search..." />
                </span>
            </div>
        </div>
    );
    const toggleFakturPembelian = async (event) => {
        setLoading(true);
        try {
            const vaTable = await postData(apiEndPointGetFakturPembelian, lazyState);
            const json = vaTable.data;
            setTotalRecords(json.total);
            setFakturPembelianTabel(json.data);
        } catch (error) {
            let e = error?.response?.data || error;
            showError(toast, e?.message || 'Terjadi Kesalahan');
        } finally {
            setLoading(false);
        }
        setLoading(false);
    };
    const onRowSelectFakturPembelian = (event) => {
        const selectedKode = event.data.FAKTUR;
        const selectedFakturPembelian = fakturPembelianTabel.find((fakturPembelian) => fakturPembelian.FAKTUR === selectedKode);
        handleFakturPembelianData(selectedFakturPembelian.FAKTUR);
        setFakturPembelianDialog(false);
    };

    return (
        <div className="grid crud-demo">
            <div className="col-12">
                {/* Dialog FakturPembelian  */}
                <Dialog visible={fakturPembelianDialog} style={{ width: '75%' }} header="Faktur Pembelian" modal className="p-fluid" onHide={() => setFakturPembelianDialog(false)}>
                    <DataTable
                        // ref={dt}
                        size="small"
                        value={fakturPembelianTabel}
                        lazy
                        dataKey="FAKTUR"
                        paginator
                        rows={10}
                        className="datatable-responsive"
                        first={lazyState.first}
                        totalRecords={totalRecords}
                        onPage={onPage}
                        loading={loading}
                        onRowSelect={onRowSelectFakturPembelian}
                        selectionMode="single" // Memungkinkan pemilihan satu baris
                        paginatorTemplate="FirstPageLink PrevPageLink PageLinks NextPageLink LastPageLink CurrentPageRedatart RowsPerPageDropdown"
                        currentPageReportTemplate="Menampilkan {first} - {last} dari {totalRecords} data"
                        filters={lazyState.filters}
                        header={headerFakturPembelian}
                        emptyMessage="Data Kosong"
                    >
                        <Column field="FAKTUR" header="FAKTUR PEMBELIAN"></Column>
                        <Column field="FAKTURPO" header="FAKTUR PO"></Column>
                        <Column field="SUPPLIER" header="SUPPLIER"></Column>
                        <Column field="TOTAL" body={(rowData) => {
                            const value = rowData.TOTAL ? parseInt(rowData.TOTAL).toLocaleString() : "";
                            return value;
                        }} header="TOTAL"></Column>
                        <Column field="TGL" body={(rowData) => rowData.TGL ? `${formatDateTable(rowData.TGL)}` : ""} header="TGL"></Column>
                        <Column field="JTHTMP" body={(rowData) => rowData.JTHTMP ? `${formatDateTable(rowData.JTHTMP)}` : ""} header="JATUH TEMPO"></Column>
                        <Column field="KETERANGAN" header="KETERANGAN"></Column>
                        <Column field="TERIMABRG" body={(rowData) => {
                            const value = rowData.TERIMABRG ? parseInt(rowData.TERIMABRG).toLocaleString() : "";
                            return value;
                        }} header="TERIMA BARANG"></Column>
                        <Column field="POBRG" body={(rowData) => {
                            const value = rowData.POBRG ? parseInt(rowData.POBRG).toLocaleString() : "";
                            return value;
                        }} header="PO BARANG"></Column>
                        <Column field="BRGRETUR" body={(rowData) => {
                            const value = rowData.BRGRETUR ? parseInt(rowData.BRGRETUR).toLocaleString() : "";
                            return value;
                        }} header="BARANG RETUR"></Column>
                    </DataTable>
                </Dialog>
            </div>
        </div>
    );
}
