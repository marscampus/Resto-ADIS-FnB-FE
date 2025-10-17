import axios from 'axios';
import getConfig from 'next/config';
import { Button } from 'primereact/button';
import { Column } from 'primereact/column';
import { DataTable } from 'primereact/datatable';
import { Dialog } from 'primereact/dialog';
import { FileUpload } from 'primereact/fileupload';
import { InputNumber } from 'primereact/inputnumber';
import { InputText } from 'primereact/inputtext';
import { InputTextarea } from 'primereact/inputtextarea';
import { RadioButton } from 'primereact/radiobutton';
import { Toast } from 'primereact/toast';
import { Toolbar } from 'primereact/toolbar';
import { classNames } from 'primereact/utils';
import React, { useEffect, useRef, useState } from 'react';
import { OverlayPanel } from 'primereact/overlaypanel';
import { TabView, TabPanel } from 'primereact/tabview';
import { Skeleton } from 'primereact/skeleton';
import TabelSkaleton from '../../component/tabel/skaleton';
import { Paginator } from 'primereact/paginator';
import { BreadCrumb } from 'primereact/breadcrumb';
import { Calendar } from 'primereact/calendar';
import { Dropdown } from 'primereact/dropdown';
import postData from '../../lib/Axios';

export default function AdjustPrintPriceTagMargin({ adjustDialog, setAdjustDialog, handleAdjust }) {
    // --------------------------------------------------------------------------------------------------- Export
    const [column, setColumn] = useState('3');
    const [selectedPaperSize, setSelectedPaperSize] = useState('A4');
    const [pdfUrl, setPdfUrl] = useState('');
    const paperSizes = [
        { name: 'A4', value: 'A4' },
        { name: 'Letter', value: 'Letter' },
        { name: 'Legal', value: 'Legal' }
    ];
    const columnOptions = [
        { label: '1', value: '1' },
        { label: '2', value: '2' },
        { label: '3', value: '3' }
    ];
    const handlePaperSizeChange = (event) => {
        setSelectedPaperSize(event.target.value);
    };
    const handleColumnChange = (event) => {
        setColumn(event.target.value);
    };
    function handleShowPreview() {
        setAdjustDialog(true);
    }

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

    useEffect(() => {
        loadLazyData();
    }, [lazyState]);

    const [dataAdjust, setDataAdjust] = useState({ paperWidth: 210 });
    const loadLazyData = async () => { };

    const onInputChange = (e, name) => {
        // const val = (e.target && e.target.value) || "";
        const val = e.value || 0;
        let _dataAdjust = { ...dataAdjust };
        _dataAdjust[name] = val;
        setDataAdjust(_dataAdjust);
    };
    const marginConfig = async () => {
        handleAdjust(dataAdjust);
        setAdjustDialog(false);
    };

    const footernya = () => {
        return (
            <React.Fragment>
                <div className="flex flex-row md:justify-between md:align-items-center">
                    <div className="flex flex-row" style={{ justifyContent: 'flex-start' }}>
                        <Button label="Cetak" icon="pi pi-file" className="p-button-danger mr-2" onClick={marginConfig} />
                    </div>
                </div>
            </React.Fragment>
        );
    };
    return (
        <div className="grid crud-demo">
            <div className="col-12">
                <Dialog visible={adjustDialog} onHide={() => setAdjustDialog(false)} header="Adjust Print Margin" style={{ width: '70%' }}>
                    <div>
                        <div class="grid">
                            <div class="col-12 md:col-12 lg:col-12">
                                <div className="card">
                                    <div class="grid">
                                        <div class="col-12 md:col-12 lg:col-12">
                                            <label htmlFor="rekening">Lebar Kertas</label>
                                            <div className="p-inputgroup" style={{ marginTop: '5px' }}>
                                                <InputNumber id="paperWidth" value={dataAdjust.paperWidth} onChange={(e) => onInputChange(e, 'paperWidth')} min="0" />
                                                <span className="p-inputgroup-addon">mm</span>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                        <Toolbar className="mb-4" right={footernya}></Toolbar>
                    </div>
                </Dialog>
            </div>
        </div>
    );
}
