/*
 * Copyright (C) Godong
 *http://www.marstech.co.id
 *Email. info@marstech.co.id
 *Telp. 0811-3636-09
 *Office        : Jl. Margatama Asri IV, Kanigoro, Kec. Kartoharjo, Kota Madiun, Jawa Timur 63118
 *Branch Office : Perum Griya Gadang Sejahtera Kav. 14 Gadang - Sukun - Kota Malang - Jawa Timur
 *
 *Godong
 *Adalah merek dagang dari PT. Marstech Global
 *
 *License Agreement
 *Software komputer atau perangkat lunak komputer ini telah diakui sebagai salah satu aset perusahaan yang bernilai.
 *Di Indonesia secara khusus,
 *software telah dianggap seperti benda-benda berwujud lainnya yang memiliki kekuatan hukum.
 *Oleh karena itu pemilik software berhak untuk memberi ijin atau tidak memberi ijin orang lain untuk menggunakan softwarenya.
 *Dalam hal ini ada aturan hukum yang berlaku di Indonesia yang secara khusus melindungi para programmer dari pembajakan software yang mereka buat,
 *yaitu diatur dalam hukum hak kekayaan intelektual (HAKI).
 *
 *********************************************************************************************************
 *Pasal 72 ayat 3 UU Hak Cipta berbunyi,
 *' Barangsiapa dengan sengaja dan tanpa hak memperbanyak penggunaan untuk kepentingan komersial '
 *' suatu program komputer dipidana dengan pidana penjara paling lama 5 (lima) tahun dan/atau '
 *' denda paling banyak Rp. 500.000.000,00 (lima ratus juta rupiah) '
 *********************************************************************************************************
 *
 *Proprietary Software
 *Adalah software berpemilik, sehingga seseorang harus meminta izin serta dilarang untuk mengedarkan,
 *menggunakan atau memodifikasi software tersebut.
 *
 *Commercial software
 *Adalah software yang dibuat dan dikembangkan oleh perusahaan dengan konsep bisnis,
 *dibutuhkan proses pembelian atau sewa untuk bisa menggunakan software tersebut.
 *Detail Licensi yang dianut di software https://en.wikipedia.org/wiki/Proprietary_software
 *EULA https://en.wikipedia.org/wiki/End-user_license_agreement
 *
 *Lisensi Perangkat Lunak https://id.wikipedia.org/wiki/Lisensi_perangkat_lunak
 *EULA https://id.wikipedia.org/wiki/EULA
 *
 * Created on Mon Sep 16 2024 - 11:28:51
 * Author : ARADHEA | aradheadhifa23@gmail.com
 * Version : 1.0
 */

import { useEffect, useState } from 'react';
import { Dialog } from 'primereact/dialog';
import { DataTable } from 'primereact/datatable';
import { Column } from 'primereact/column';
import { Dropdown } from 'primereact/dropdown';
import { InputText } from 'primereact/inputtext';
import postData from '../../../lib/Axios';

export default function NotaService({ notaServiceDialog, setNotaServiceDialog, btnNotaService, handleNotaServiceData }) {
    const apiEndPointGetDataNotaService = '/api/service/nota/get/faktur';
    const [totalRecords, setTotalRecords] = useState(0);
    const [loading, setLoading] = useState(false);
    const [notaServiceTabel, setNotaServiceTabel] = useState(null);
    const [defaultOption, setDropdownValue] = useState(null);
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
        if (notaServiceDialog && btnNotaService) {
            toggleNotaService();
        }
    }, [notaServiceDialog, btnNotaService, lazyState]);

    const dropdownValues = [
        { name: 'Faktur', label: 'Faktur' },
        { name: 'Tgl', label: 'Tgl' }
    ];

    const [timer, setTimer] = useState(null);
    const inputChanged = (e) => {
        clearTimeout(timer);

        const newTimer = setTimeout(() => {
            let _lazyState = { ...lazyState };
            _lazyState['filters'] = { ...lazyState.filters };
            if (defaultOption != null && defaultOption.name != null) {
                _lazyState['filters'][defaultOption.name] = e;
            }
            onPage(_lazyState);
        }, 500);
        setTimer(newTimer);
    };

    const headerNotaService = (
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

    const toggleNotaService = async (event) => {
        setLoading(true);
        try {
            const vaData = await postData(apiEndPointGetDataNotaService, lazyState);
            const json = vaData.data;
            setTotalRecords(json.total_data);
            setNotaServiceTabel(json.data);
        } catch (error) {
            console.error('Error:', error);
        } finally {
            setLoading(false);
        }
        setLoading(false);
    };

    const onRowSelectNotaService = (event) => {
        const selectedNota = event.data.Kode;
        const selectedNotaService = notaServiceTabel.find((notaService) => notaService.Kode === selectedNota);
        handleNotaServiceData(selectedNotaService.Kode);
        setNotaServiceDialog(false);
    };

    return (
        <div className="grid crud-demo">
            <div className="col-12">
                <Dialog visible={notaServiceDialog} style={{ width: '75%' }} header="Nota Service" modal className="p-fluid" onHide={() => setNotaServiceDialog(false)}>
                    <DataTable
                        size="small"
                        value={notaServiceTabel}
                        lazy
                        dataKey="Kode"
                        paginator
                        rows={10}
                        className="datatable-responsive"
                        first={lazyState.first}
                        totalRecords={totalRecords}
                        onPage={onPage}
                        loading={loading}
                        onRowSelect={onRowSelectNotaService}
                        selectionMode="single"
                        paginatorTemplate="FirstPageLink PrevPageLink PageLinks NextPageLink LastPageLink CurrentPageRedatart RowsPerPageDropdown"
                        currentPageReportTemplate="Menampilkan {first} - {last} dari {totalRecords} data"
                        filters={lazyState.filters}
                        header={headerNotaService}
                        emptyMessage="Data Kosong"
                    >
                        <Column field="Kode" header="KODE"></Column>
                        <Column field="Tgl" header="TANGGAL"></Column>
                        <Column field="Pemilik" header="PEMILIK"></Column>
                        <Column field="NoTelepon" header="NO. TELEPON"></Column>
                        <Column field="EstimasiSelesai" header="ESTIMASI SELESAI"></Column>
                    </DataTable>
                </Dialog>
            </div>
        </div>
    );
}
