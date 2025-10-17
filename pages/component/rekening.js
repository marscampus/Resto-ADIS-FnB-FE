import { Column } from 'primereact/column';
import { DataTable } from 'primereact/datatable';
import { Dialog } from 'primereact/dialog';
import { TabPanel, TabView } from 'primereact/tabview';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import TabelSkaleton from '../../component/tabel/skaleton';
import postData from '../../lib/Axios';
import { InputText } from 'primereact/inputtext';

export default function Rekening({ rekeningDialog, setRekeningDialog, btnRekening, handleRekeningData }) {
    const apiEndPointGetRekening = '/api/rekening/get';

    const [search, setSearch] = useState('');
    const [first, setFirst] = useState(0); // Halaman pertama
    const [rows, setRows] = useState(10); // Jumlah baris per halaman
    const [totalRecords, setTotalRecords] = useState(0);
    const [loading, setLoading] = useState(false);
    const [defaultOption, setDropdownValue] = useState(null);
    const [activeIndex, setActiveIndex] = useState(0);
    const [filteredRekening1, setFilteredRekening1] = useState(null);
    const [filteredRekening2, setFilteredRekening2] = useState(null);
    const [filteredRekening3, setFilteredRekening3] = useState(null);
    const [filteredRekening4, setFilteredRekening4] = useState(null);
    const [filteredRekening5, setFilteredRekening5] = useState(null);
    const [filteredRekening6, setFilteredRekening6] = useState(null);

    const [lazyState, setlazyState] = useState({
        first: 0,
        rows: 10,
        page: 0,
        sortField: null,
        sortOrder: null,
        filters: {
            kode: 1,
            search: ''
        }
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
        toggleDataTable({ index: activeIndex });
    };

    const itemsSkelaton = Array.from({ length: 2 }, (v, i) => i);
    const columns = [
        { field: 'KODE', header: 'KODE' },
        { field: 'KETERANGAN', header: 'KETERANGAN' },
        { field: 'JENISREKENING', header: 'JENISREKENING' }
    ];

    const [rekening1, setRekening1] = useState(null);
    const [rekening2, setRekening2] = useState(null);
    const [rekening3, setRekening3] = useState(null);
    const [rekening4, setRekening4] = useState(null);
    const [rekening5, setRekening5] = useState(null);
    const [rekening6, setRekening6] = useState(null);

    const op = useRef(null);

    const toggleDataTable = useCallback(
        async (event = { index: 0 }) => {
            let indeks = null;
            let skipRequest = false;

            switch (event.index) {
                case 1:
                    indeks = 2;
                    if (rekening2 !== null) skipRequest = true;
                    break;
                case 2:
                    indeks = 3;
                    if (rekening3 !== null) skipRequest = true;
                    break;
                case 3:
                    indeks = 4;
                    if (rekening4 !== null) skipRequest = true;
                    break;
                case 4:
                    indeks = 5;
                    if (rekening5 !== null) skipRequest = true;
                    break;
                case 5:
                    indeks = 6;
                    if (rekening6 !== null) skipRequest = true;
                    break;
                default:
                    indeks = 1;
                    if (rekening1 !== null) skipRequest = true;
                    break;
            }

            setActiveIndex(event.index);
            setLoading(true);

            if (!skipRequest) {
                try {
                    const resRekening = await dataTableRekeningKredit(indeks);
                    updateStateRekening(indeks, resRekening);
                } catch (error) {
                    console.error('Error fetching data:', error);
                }
            }

            setLoading(false);
        },
        [rekening1, rekening2, rekening3, rekening4, rekening5, rekening6]
    );

    const updateStateRekening = (indeks, data) => {
        switch (indeks) {
            case 2:
                setRekening2(data);
                break;
            case 3:
                setRekening3(data);
                break;
            case 4:
                setRekening4(data);
                break;
            case 5:
                setRekening5(data);
                break;
            case 6:
                setRekening6(data);
                break;
            default:
                setRekening1(data);
                break;
        }
    };

    const dataTableRekeningKredit = async (id) => {
        try {
            const response = await postData(apiEndPointGetRekening, { Kode: id });
            return response.data.data;
        } catch (error) {
            return [];
        }
    };

    useEffect(() => {
        if (rekeningDialog && btnRekening) {
            toggleDataTable({ index: activeIndex });
        }
    }, [rekeningDialog, btnRekening, toggleDataTable, activeIndex]);

    const onRowSelect = (event) => {
        const selectedKode = event.data;
        handleRekeningData(selectedKode.Kode, selectedKode.Keterangan, selectedKode.Jenis);
        setRekeningDialog(false);
    };

    const bodyJenisRekening = (rowData) => {
        return <span>{rowData.Jenis === 'I' ? 'Induk' : 'Detail'}</span>;
    };

    // Yang Handle Search Data
    const header = (
        <div className="flex flex-column md:flex-row md:justify-content-between md:align-items-center">
            <h5 className="m-0"></h5>
            <div className="flex flex-column md:flex-row md:justify-content-between md:align-items-center">
                <span className="block mt-2 md:mt-0 p-input-icon-left">
                    <i className="pi pi-search" />
                    <InputText type="search" onInput={(e) => handleSearch(e.target.value)} placeholder="Search..." value={search} />
                </span>
            </div>
        </div>
    );

    const handleSearch = (searchVal) => {
        setSearch(searchVal); // Update nilai input pencarian

        const searchRegex = new RegExp(searchVal, 'i'); // Case-insensitive regex

        const filterData = (data) => {
            if (!data) return null;
            return data.filter((item) => searchRegex.test(item.Kode) || searchRegex.test(item.Keterangan) || searchRegex.test(item.Jenis));
        };

        setFilteredRekening1(filterData(rekening1));
        setFilteredRekening2(filterData(rekening2));
        setFilteredRekening3(filterData(rekening3));
        setFilteredRekening4(filterData(rekening4));
        setFilteredRekening5(filterData(rekening5));
        setFilteredRekening6(filterData(rekening6));
    };

    return (
        <div className="grid crud-demo">
            <div className="col-12">
                {/* Dialog Rekening  */}
                <Dialog visible={rekeningDialog} style={{ width: '50%' }} header="Rekening" modal className="p-fluid" onHide={() => setRekeningDialog(false)}>
                    <TabView activeIndex={activeIndex} onTabChange={toggleDataTable}>
                        <TabPanel header="ASET">
                            {loading && <TabelSkaleton items={itemsSkelaton} kolom={columns} />}
                            {!loading && (
                                <DataTable
                                    onRowSelect={onRowSelect}
                                    selectionMode="single"
                                    size="small"
                                    value={filteredRekening1 || rekening1}
                                    filters={lazyState.filters}
                                    header={header}
                                    first={first} // Menggunakan nilai halaman pertama dari state
                                    rows={rows} // Menggunakan nilai jumlah baris per halaman dari state
                                    onPage={onPage} // Memanggil fungsi onPage saat halaman berubah
                                    paginator
                                    paginatorTemplate={`FirstPageLink PrevPageLink PageLinks NextPageLink LastPageLink CurrentPageReport RowsPerPageDropdown`}
                                    currentPageReportTemplate="Menampilkan {first} - {last} dari {totalRecords} data"
                                    totalRecords={totalRecords} // Total number of records
                                    loading={loading}
                                    emptyMessage="Data Kosong"
                                    onRowsPerPageChange={(e) => setRowsPerPage(e.value)}
                                >
                                    <Column headerStyle={{ textAlign: 'center' }} field="Kode" header="KODE" />
                                    <Column headerStyle={{ textAlign: 'center' }} field="Keterangan" header="KETERANGAN" />
                                    <Column headerStyle={{ textAlign: 'center' }} field="Jenis" header="JENISREKENING" body={bodyJenisRekening} />
                                </DataTable>
                            )}
                        </TabPanel>
                        <TabPanel header="KEWAJIBAN">
                            {loading && <TabelSkaleton items={itemsSkelaton} kolom={columns} />}
                            {!loading && (
                                <DataTable
                                    onRowSelect={onRowSelect}
                                    selectionMode="single"
                                    size="small"
                                    value={filteredRekening2 || rekening2}
                                    filters={lazyState.filters}
                                    header={header}
                                    first={first} // Menggunakan nilai halaman pertama dari state
                                    rows={rows} // Menggunakan nilai jumlah baris per halaman dari state
                                    onPage={onPage} // Memanggil fungsi onPage saat halaman berubah
                                    paginator
                                    paginatorTemplate={`FirstPageLink PrevPageLink PageLinks NextPageLink LastPageLink CurrentPageReport RowsPerPageDropdown`}
                                    currentPageReportTemplate="Menampilkan {first} - {last} dari {totalRecords} data"
                                    totalRecords={totalRecords} // Total number of records
                                    loading={loading}
                                    emptyMessage="Data Kosong"
                                    onRowsPerPageChange={(e) => setRowsPerPage(e.value)}
                                >
                                    <Column headerStyle={{ textAlign: 'center' }} field="Kode" header="KODE" />
                                    <Column headerStyle={{ textAlign: 'center' }} field="Keterangan" header="KETERANGAN" />
                                    <Column headerStyle={{ textAlign: 'center' }} field="Jenis" header="JENISREKENING" body={bodyJenisRekening} />
                                </DataTable>
                            )}
                        </TabPanel>
                        <TabPanel header="MODAL">
                            {loading && <TabelSkaleton items={itemsSkelaton} kolom={columns} />}
                            {!loading && (
                                <DataTable
                                    onRowSelect={onRowSelect}
                                    selectionMode="single"
                                    size="small"
                                    value={filteredRekening3 || rekening3}
                                    filters={lazyState.filters}
                                    header={header}
                                    first={first} // Menggunakan nilai halaman pertama dari state
                                    rows={rows} // Menggunakan nilai jumlah baris per halaman dari state
                                    onPage={onPage} // Memanggil fungsi onPage saat halaman berubah
                                    paginator
                                    paginatorTemplate={`FirstPageLink PrevPageLink PageLinks NextPageLink LastPageLink CurrentPageReport RowsPerPageDropdown`}
                                    currentPageReportTemplate="Menampilkan {first} - {last} dari {totalRecords} data"
                                    totalRecords={totalRecords} // Total number of records
                                    loading={loading}
                                    emptyMessage="Data Kosong"
                                    onRowsPerPageChange={(e) => setRowsPerPage(e.value)}
                                >
                                    <Column headerStyle={{ textAlign: 'center' }} field="Kode" header="KODE" />
                                    <Column headerStyle={{ textAlign: 'center' }} field="Keterangan" header="KETERANGAN" />
                                    <Column headerStyle={{ textAlign: 'center' }} field="Jenis" header="JENISREKENING" body={bodyJenisRekening} />
                                </DataTable>
                            )}
                        </TabPanel>
                        <TabPanel header="PENDAPATAN">
                            {loading && <TabelSkaleton items={itemsSkelaton} kolom={columns} />}
                            {!loading && (
                                <DataTable
                                    onRowSelect={onRowSelect}
                                    selectionMode="single"
                                    size="small"
                                    value={filteredRekening4 || rekening4}
                                    filters={lazyState.filters}
                                    header={header}
                                    first={first} // Menggunakan nilai halaman pertama dari state
                                    rows={rows} // Menggunakan nilai jumlah baris per halaman dari state
                                    onPage={onPage} // Memanggil fungsi onPage saat halaman berubah
                                    paginator
                                    paginatorTemplate={`FirstPageLink PrevPageLink PageLinks NextPageLink LastPageLink CurrentPageReport RowsPerPageDropdown`}
                                    currentPageReportTemplate="Menampilkan {first} - {last} dari {totalRecords} data"
                                    totalRecords={totalRecords} // Total number of records
                                    loading={loading}
                                    emptyMessage="Data Kosong"
                                    onRowsPerPageChange={(e) => setRowsPerPage(e.value)}
                                >
                                    <Column headerStyle={{ textAlign: 'center' }} field="Kode" header="KODE" />
                                    <Column headerStyle={{ textAlign: 'center' }} field="Keterangan" header="KETERANGAN" />
                                    <Column headerStyle={{ textAlign: 'center' }} field="Jenis" header="JENISREKENING" body={bodyJenisRekening} />
                                </DataTable>
                            )}
                        </TabPanel>
                        <TabPanel header="BIAYA">
                            {loading && <TabelSkaleton items={itemsSkelaton} kolom={columns} />}
                            {!loading && (
                                <DataTable
                                    onRowSelect={onRowSelect}
                                    selectionMode="single"
                                    size="small"
                                    value={filteredRekening5 || rekening5}
                                    filters={lazyState.filters}
                                    header={header}
                                    first={first} // Menggunakan nilai halaman pertama dari state
                                    rows={rows} // Menggunakan nilai jumlah baris per halaman dari state
                                    onPage={onPage} // Memanggil fungsi onPage saat halaman berubah
                                    paginator
                                    paginatorTemplate={`FirstPageLink PrevPageLink PageLinks NextPageLink LastPageLink CurrentPageReport RowsPerPageDropdown`}
                                    currentPageReportTemplate="Menampilkan {first} - {last} dari {totalRecords} data"
                                    totalRecords={totalRecords} // Total number of records
                                    loading={loading}
                                    emptyMessage="Data Kosong"
                                    onRowsPerPageChange={(e) => setRowsPerPage(e.value)}
                                >
                                    <Column headerStyle={{ textAlign: 'center' }} field="Kode" header="KODE" />
                                    <Column headerStyle={{ textAlign: 'center' }} field="Keterangan" header="KETERANGAN" />
                                    <Column headerStyle={{ textAlign: 'center' }} field="Jenis" header="JENISREKENING" body={bodyJenisRekening} />
                                </DataTable>
                            )}
                        </TabPanel>
                        <TabPanel header="ADMINISTRATIF">
                            {loading && <TabelSkaleton items={itemsSkelaton} kolom={columns} />}
                            {!loading && (
                                <DataTable
                                    onRowSelect={onRowSelect}
                                    selectionMode="single"
                                    size="small"
                                    value={filteredRekening6 || rekening6}
                                    filters={lazyState.filters}
                                    header={header}
                                    first={first} // Menggunakan nilai halaman pertama dari state
                                    rows={rows} // Menggunakan nilai jumlah baris per halaman dari state
                                    onPage={onPage} // Memanggil fungsi onPage saat halaman berubah
                                    paginator
                                    paginatorTemplate={`FirstPageLink PrevPageLink PageLinks NextPageLink LastPageLink CurrentPageReport RowsPerPageDropdown`}
                                    currentPageReportTemplate="Menampilkan {first} - {last} dari {totalRecords} data"
                                    totalRecords={totalRecords} // Total number of records
                                    loading={loading}
                                    emptyMessage="Data Kosong"
                                    onRowsPerPageChange={(e) => setRowsPerPage(e.value)}
                                >
                                    <Column headerStyle={{ textAlign: 'center' }} field="Kode" header="KODE" />
                                    <Column headerStyle={{ textAlign: 'center' }} field="Keterangan" header="KETERANGAN" />
                                    <Column headerStyle={{ textAlign: 'center' }} field="Jenis" header="JENISREKENING" body={bodyJenisRekening} />
                                </DataTable>
                            )}
                        </TabPanel>
                    </TabView>
                </Dialog>
            </div>
        </div>
    );
}
