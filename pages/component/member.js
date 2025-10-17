import { Column } from 'primereact/column';
import { DataTable } from 'primereact/datatable';
import { Dialog } from 'primereact/dialog';
import { Dropdown } from 'primereact/dropdown';
import { InputText } from 'primereact/inputtext';
import React, { useEffect, useRef, useState } from 'react';
import postData from "../../lib/Axios";

export default function Member({ memberDialog, setMemberDialog, btnMember, handleMemberData }) {
    const apiEndPointGetMember = '/api/member/get';

    const [totalRecords, setTotalRecords] = useState(0);
    const [loadingMember, setLoadingMember] = useState(false);
    const [memberTabel, setMemberTabel] = useState(null);
    const [memberTabelFilt, setMemberTabelFilt] = useState(null);
    const [defaultOption, setDropdownValue] = useState(null);
    const [search, setSearch] = useState('');
    const [first, setFirst] = useState(0); // Halaman pertama
    const [rows, setRows] = useState(10); // Jumlah baris per halaman
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

    useEffect(() => {
        setMemberTabelFilt(memberTabel);
    }, [memberTabel, lazyState]);

    useEffect(() => {
        if (memberDialog && btnMember) {
            toggleMember();
        }
    }, [memberDialog, btnMember, lazyState]);

    const loadLazyData = async () => {
        setLoadingMember(true);
        try {
            const header = {
                "Content-Type": "application/json;charset=UTF-8",
                "X-ENDPOINT": apiEndPointGetMember,
            };
            // const vaTable = await axios.post(apiDirPath, lazyState, { headers: header });
            const vaTable = await postData(apiEndPointGetMember, lazyState);
            const json = vaTable.data;
            setTotalRecords(json.total);
            setMemberTabel(json.data);
        } catch (error) {
            console.error("Error:", error);
        } finally {
            setLoadingMember(false);
        }
    };
    // -----------------------------------------------------------------------------------------------------------------< Member >
    const dropdownValues = [
        { name: "KODE", label: "KODE" },
        { name: "NAMA", label: "NAMA" },
    ];
    const [timer, setTimer] = useState(null);
    const inputChanged = (e) => {
        clearTimeout(timer);

        const newTimer = setTimeout(() => {
            let _lazyState = { ...lazyState };
            _lazyState["filters"] = { ...lazyState.filters }; // Copy existing filters
            // if (selectedSesi) {
            //     // Add selectedSesi to filters if available
            //     _lazyState.filters["selectedSesi"] = selectedSesi;
            // }
            if (defaultOption != null && defaultOption.name != null) {
                _lazyState["filters"][defaultOption.name] = e;
            }
            onPage(_lazyState);
        }, 500);

        setTimer(newTimer);
    };
    const headerMember = (
        <div className="flex flex-column md:flex-row md:justify-content-between md:align-items-center">
            <h5 className="m-0"> </h5>
            <div className="flex flex-column md:flex-row md:justify-content-between md:align-items-center">
                &nbsp;
                <span className="block mt-2 md:mt-0 p-input-icon-left">
                    <i className="pi pi-search" />
                    <InputText type="search" onInput={(e) => filterPlugins('search', e.target.value)} placeholder="Search..." value={search} />
                </span>
            </div>
        </div>
    );

    const filterPlugins = (name, searchVal) => {
        const x = searchVal.length > 0 ? new RegExp(searchVal, 'i') : null;
        let filtered = [];

        if (name == 'search') {
            filtered = memberTabel.filter((d) => (x ? x.test(d.KODE) || x.test(d.NAMA) || x.test(d.ALAMAT) : []));
            setSearch(searchVal);
        }

        setMemberTabelFilt(filtered);
    };

    const toggleMember = async (event) => {
        setLoadingMember(true);
        // setMemberDialog(true);
        try {
            const header = {
                "Content-Type": "application/json;charset=UTF-8",
                "X-ENDPOINT": apiEndPointGetMember,
            };
            // const vaTable = await axios.post(apiDirPath, lazyState, { headers: header });
            const vaTable = await postData(apiEndPointGetMember, lazyState);
            const json = vaTable.data;
            setTotalRecords(json.total);
            setMemberTabel(json.data);
        } catch (error) {
            console.error("Error:", error);
        } finally {
            setLoadingMember(false);
        }
        setLoadingMember(false);
    };
    const onRowSelectMember = (event) => {
        const selectedKode = event.data.KODE;
        const selectedMember = memberTabel.find((member) => member.KODE === selectedKode);
        handleMemberData(selectedMember.KODE, selectedMember.NAMA, selectedMember.ALAMAT);
        setMemberDialog(false);
    };

    return (
        <div className="grid crud-demo">
            <div className="col-12">
                {/* Dialog Member  */}
                <Dialog visible={memberDialog} header="Member" modal className="p-fluid" onHide={() => setMemberDialog(false)}>
                    <DataTable
                        value={memberTabelFilt}
                        filters={lazyState.filters}
                        header={headerMember}
                        first={first} // Menggunakan nilai halaman pertama dari state
                        rows={rows} // Menggunakan nilai jumlah baris per halaman dari state
                        onPage={onPage} // Memanggil fungsi onPage saat halaman berubah
                        paginator
                        paginatorTemplate={`FirstPageLink PrevPageLink PageLinks NextPageLink LastPageLink CurrentPageReport RowsPerPageDropdown`}
                        currentPageReportTemplate="Menampilkan {first} - {last} dari {totalRecords} data"
                        totalRecords={totalRecords} // Total number of records
                        size="small"
                        emptyMessage="Data Kosong"
                        onRowsPerPageChange={(e) => setRowsPerPage(e.value)}
                        onRowSelect={onRowSelectMember}
                        selectionMode="single" // Memungkinkan pemilihan satu baris
                    >
                        <Column headerStyle={{ textAlign: "center" }} field="KODE" header="KODE"></Column>
                        <Column headerStyle={{ textAlign: "center" }} field="NAMA" header="NAMA"></Column>
                        <Column headerStyle={{ textAlign: "center" }} field="ALAMAT" header="ALAMAT"></Column>
                    </DataTable>
                </Dialog>
            </div>
        </div>
    );
}
