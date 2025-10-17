import { useFormik } from 'formik';
import { Toast } from 'primereact/toast';
import { InputText } from 'primereact/inputtext';
import { useEffect, useRef, useState } from 'react';
import { Button } from 'primereact/button';
import { ToggleButton } from 'primereact/togglebutton';
import { InputNumber } from 'primereact/inputnumber';
import { BlockUI } from 'primereact/blockui';
import { getSessionServerSide } from '../../../utilities/servertool';
import { InputTextarea } from 'primereact/inputtextarea';
import postData from '../../../lib/Axios';
import { RadioButton } from 'primereact/radiobutton';

export async function getSessionSideProps(context) {
    const sessionData = await getSessionServerSide(context, context.resolvedUrl);
    if (sessionData?.redirect) {
        return sessionData;
    }
    return {
        props: {}
    };
}

const Konfigurasi = (props) => {
    const apiEndPointGet = "/api/info_perusahaan/data";
    const apiEndPointStore = "/api/info_perusahaan/store";
    //state
    const toast = useRef(null);

    const [infoPerusahaan, setInfoPerusahaan] = useState({
        load: false,
        edit: false
    });
    //

    //function

    const showSuccess = (detail) => {
        toast.current.show({ severity: 'success', summary: 'Success Message', detail: detail, life: 3000 });
    };

    const showError = (detail) => {
        toast.current.show({ severity: 'error', summary: 'Error Message', detail: detail, life: 3000 });
    };

    const formik = useFormik({
        initialValues: {
            namaPerusahaan: '',
            alamatPerusahaan: '',
            infoKasir: '',
            msPPN: 0,
            nominalPoint: 0,
            kelipatanType: 'struk',
            kelipatanPoint: 0,
            minNPerStruk: 0,
            logoPerusahaan: ''
        },
        validate: (data) => {
            let errors = {};

            return errors;
        },
        onSubmit: (data) => {
            handleSave(data);
        }
    });

    const getDataConfig = async () => {
        setInfoPerusahaan((prev) => ({ ...prev, load: true }));
        try {
            const res = await postData(apiEndPointGet, {
                kode: ['namaPerusahaan', 'alamatPerusahaan',
                    'kotaPerusahaan', 'teleponPerusahaan',
                    'infoKasir', 'msPPN', 'nominalPoint',
                    'kelipatanType', 'kelipatanPoint',
                    'logoPerusahaan', 'minNPerStruk'
                ]
            });

            formik.setValues({
                namaPerusahaan: res.data.data.namaPerusahaan,
                kotaPerusahaan: res.data.data.kotaPerusahaan,
                teleponPerusahaan: res.data.data.teleponPerusahaan,
                alamatPerusahaan: res.data.data.alamatPerusahaan,
                infoKasir: res.data.data.infoKasir,
                msPPN: res.data.data.msPPN,
                nominalPoint: res.data.data.nominalPoint,
                kelipatanType: res.data.data.kelipatanType || 'struk',
                minNPerStruk: res.data.data.minNPerStruk || 0,
                kelipatanPoint: res.data.data.kelipatanPoint || 0,
                logoPerusahaan: res.data.data.logoPerusahaan
            });
            setInfoPerusahaan((prev) => ({ ...prev, load: false }));
        } catch (error) {
            const e = error.response?.data;
            showError(e?.message || 'Terjadi Kesalahan');
            setInfoPerusahaan((prev) => ({ ...prev, load: false }));
        }
    };

    const isFormFieldInvalid = (name) => !!(formik.touched[name] && formik.errors[name]);

    const getFormErrorMessage = (name) => {
        return isFormFieldInvalid(name) ? <small className="p-error">{formik.errors[name]}</small> : <small className="p-error">&nbsp;</small>;
    };

    useEffect(() => {
        getDataConfig();
    }, []);

    const handleSave = async (input) => {
        setInfoPerusahaan((prev) => ({ ...prev, load: true }));

        try {
            const key = Object.keys(input);
            const keterangan = Object.values(input);
            const res = await postData(apiEndPointStore, { kode: key, keterangan: keterangan });
            showSuccess(res.data.message || 'Berhasil Insert Data');
            setInfoPerusahaan((prev) => ({ ...prev, load: false, edit: false }));
        } catch (error) {
            const e = error.response?.data;
            showError(e?.message || 'Terjadi Kesalahan');
            setInfoPerusahaan((prev) => ({ ...prev, load: false }));
        }
    };

    const onFileSelect = (event) => {
        const file = event.target.files[0]; // Ambil file pertama dari FileUpload
        if (file.size > 900000) {
            formik.setFieldValue('logoPerusahaan', null);
            return showError('File tidak boleh lebih dari 1MB.');
        }
        const reader = new FileReader();

        reader.onload = (e) => {
            formik.setFieldValue('logoPerusahaan', e.target.result);
        };

        if (file) {
            reader.readAsDataURL(file); // Konversi file ke base64
        }
    };
    //

    return (
        <>
            <div className="card">
                <BlockUI blocked={infoPerusahaan.load} template={<i className="pi pi-spinpi pi-spin pi-spinner" style={{ fontSize: '28px' }}></i>}>
                    <Toast ref={toast} />
                    <div
                        style={{
                            backgroundColor: '#F8F9FA',
                            padding: '10px 20px',
                            borderTop: 'solid 1px #aaaaaa',
                            borderBottom: 'solid 1px #aaaaaa',
                            marginBottom: '10px'
                        }}
                    >
                        <div className="flex justify-content-between align-items-center">
                            <span className="font-bold text-xl">Informasi Perusahaan</span>
                            <ToggleButton onChange={(e) => setInfoPerusahaan((p) => ({ ...p, edit: e.value }))} checked={infoPerusahaan.edit} onLabel="Edit Mode" offLabel="Info Mode" />
                        </div>
                    </div>
                    <form onSubmit={formik.handleSubmit} className="flex flex-column gap-2">
                        <div className="flex flex-column sm:flex-row gap-3">
                            <div className={infoPerusahaan.edit ? 'p-image-preview-container' : 'p-image-container'} style={{ width: '250px', height: '250px', borderRadius: '6px' }}>
                                <img src={formik.values.logoPerusahaan ? formik.values.logoPerusahaan : '/layout/images/no_img.jpg'} alt="logoPerusahaan" style={{ width: '250px', height: '250px', objectFit: 'cover', objectPosition: 'center', borderRadius: '6px' }} />
                                {infoPerusahaan.edit ? (
                                    <div className="p-image-preview-indicator" style={{ borderRadius: '6px' }} onClick={() => document.getElementById('fileInput').click()}>
                                        <i className="pi pi-pencil"></i>
                                    </div>
                                ) : (
                                    ''
                                )}
                                <input
                                    type="file"
                                    id="fileInput"
                                    accept="image/*"
                                    style={{ display: 'none' }} // Menyembunyikan input file
                                    onChange={onFileSelect}
                                />
                            </div>
                            <div className="flex flex-column w-full gap-2">
                                <div className="flex flex-column gap-2 w-full">
                                    <label htmlFor="namaPerusahaan">Nama Perusahaan</label>
                                    <div className="p-inputgroup">
                                        <InputText
                                            style={{ width: '100%' }}
                                            id="namaPerusahaan"
                                            name="namaPerusahaan"
                                            readOnly={!infoPerusahaan.edit}
                                            value={formik.values.namaPerusahaan}
                                            onChange={(e) => {
                                                formik.setFieldValue('namaPerusahaan', e.target.value);
                                            }}
                                            className={isFormFieldInvalid('namaPerusahaan') ? 'p-invalid' : ''}
                                        />
                                    </div>
                                    {isFormFieldInvalid('namaPerusahaan') ? getFormErrorMessage('namaPerusahaan') : ''}
                                </div>
                                <div className="flex flex-column gap-2 w-full">
                                    <label htmlFor="alamatPerusahaan">Alamat Perusahaan</label>
                                    <div className="p-inputgroup">
                                        <InputText
                                            style={{ width: '100%' }}
                                            readOnly={!infoPerusahaan.edit}
                                            id="alamatPerusahaan"
                                            name="alamatPerusahaan"
                                            value={formik.values.alamatPerusahaan}
                                            onChange={(e) => {
                                                formik.setFieldValue('alamatPerusahaan', e.target.value);
                                            }}
                                            className={isFormFieldInvalid('alamatPerusahaan') ? 'p-invalid' : ''}
                                        />
                                    </div>
                                    {isFormFieldInvalid('alamatPerusahaan') ? getFormErrorMessage('alamatPerusahaan') : ''}
                                </div>
                                <div className='flex gap-2'>
                                    <div className="flex flex-column gap-2 w-full">
                                        <label htmlFor="kotaPerusahaan">Kota Perusahaan</label>
                                        <div className="p-inputgroup">
                                            <InputText
                                                style={{ width: '100%' }}
                                                readOnly={!infoPerusahaan.edit}
                                                id="kotaPerusahaan"
                                                name="kotaPerusahaan"
                                                value={formik.values.kotaPerusahaan}
                                                onChange={(e) => {
                                                    formik.setFieldValue('kotaPerusahaan', e.target.value);
                                                }}
                                                className={isFormFieldInvalid('kotaPerusahaan') ? 'p-invalid' : ''}
                                            />
                                        </div>
                                        {isFormFieldInvalid('kotaPerusahaan') ? getFormErrorMessage('kotaPerusahaan') : ''}
                                    </div>
                                    <div className="flex flex-column gap-2 w-full">
                                        <label htmlFor="teleponPerusahaan">Telepon Perusahaan</label>
                                        <div className="p-inputgroup">
                                            <InputText
                                                style={{ width: '100%' }}
                                                readOnly={!infoPerusahaan.edit}
                                                id="teleponPerusahaan"
                                                name="teleponPerusahaan"
                                                value={formik.values.teleponPerusahaan}
                                                onChange={(e) => {
                                                    const value = e.target.value.replace(/[^0-9]/g, '');
                                                    formik.setFieldValue('teleponPerusahaan', value);
                                                }}
                                                className={isFormFieldInvalid('teleponPerusahaan') ? 'p-invalid' : ''}
                                            />
                                        </div>
                                        {isFormFieldInvalid('teleponPerusahaan') ? getFormErrorMessage('teleponPerusahaan') : ''}
                                    </div>
                                </div>
                                <div className="flex flex-column gap-2 w-full">
                                    <label htmlFor="infoKasir">Info Kasir</label>
                                    <div className="p-inputgroup">
                                        <InputTextarea
                                            autoResize
                                            value={formik.values.infoKasir}
                                            onChange={(e) => {
                                                formik.setFieldValue('infoKasir', e.target.value);
                                            }}
                                            rows={2} cols={30} />
                                    </div>
                                    {isFormFieldInvalid('infoKasir') ? getFormErrorMessage('infoKasir') : ''}
                                </div>
                                <div className="flex flex-column gap-2 w-full">
                                    <label htmlFor="msPPN">PPN</label>
                                    <div className="p-inputgroup">
                                        <InputNumber
                                            style={{ width: '100%' }}
                                            inputStyle={{ textAlign: 'right' }}
                                            readOnly={!infoPerusahaan.edit}
                                            id="msPPN"
                                            name="msPPN"
                                            min={0}
                                            max={100}
                                            value={formik.values.msPPN == '' ? 0 : formik.values.msPPN}
                                            onChange={(e) => {
                                                const msPPN = e.value == '' ? 0 : e.value;

                                                formik.setFieldValue('msPPN', msPPN);
                                            }}
                                            className={isFormFieldInvalid('msPPN') ? 'p-invalid' : ''}
                                        />
                                        <Button label="%" style={{ pointerEvents: 'none' }}></Button>
                                    </div>
                                    {isFormFieldInvalid('msPPN') ? getFormErrorMessage('msPPN') : ''}
                                </div>
                                <div className="flex flex-column gap-2 w-full">
                                    <label htmlFor="nominalPoint">Nilai Per Point</label>
                                    <div className="p-inputgroup">
                                        <InputNumber
                                            inputStyle={{ textAlign: 'right' }}
                                            readOnly={!infoPerusahaan.edit}
                                            id="nominalPoint"
                                            name="nominalPoint"
                                            min={0}
                                            value={formik.values.nominalPoint == '' ? 0 : formik.values.nominalPoint}
                                            onChange={(e) => {
                                                const nominalPoint = e.value == '' ? 0 : e.value;

                                                formik.setFieldValue('nominalPoint', nominalPoint);
                                            }}
                                            className={isFormFieldInvalid('nominalPoint') ? 'p-invalid' : ''}
                                        />
                                        <Button label="/ 1 Point" className="p-button" readOnly style={{ pointerEvents: "none" }} />
                                    </div>
                                    {isFormFieldInvalid('nominalPoint') ? getFormErrorMessage('nominalPoint') : ''}
                                </div>
                                <div className="flex flex-column gap-2 w-full">
                                    <label htmlFor="kelipatanType">Cara Member Mendapatkan Point</label>
                                    <div className="flex flex-row gap-4">
                                        <div className="flex align-items-center">
                                            <RadioButton
                                                inputId="perStruk"
                                                name="kelipatanType"
                                                value="struk"
                                                checked={formik.values.kelipatanType === 'struk'}
                                                onChange={(e) => {
                                                    formik.setFieldValue('kelipatanType', e.value);
                                                }}
                                                disabled={!infoPerusahaan.edit}
                                            />
                                            <label htmlFor="perStruk" className="ml-2">Per Struk</label>
                                        </div>
                                        <div className="flex align-items-center">
                                            <RadioButton
                                                inputId="perNominal"
                                                name="kelipatanType"
                                                value="nominal"
                                                checked={formik.values.kelipatanType === 'nominal'}
                                                onChange={(e) => {
                                                    formik.setFieldValue('kelipatanType', e.value);
                                                }}
                                                disabled={!infoPerusahaan.edit}
                                            />
                                            <label htmlFor="perNominal" className="ml-2">Per Kelipatan Nominal</label>
                                        </div>
                                    </div>

                                    {formik.values.kelipatanType === 'nominal' ? (
                                        <div className="p-inputgroup">
                                            <InputNumber
                                                inputStyle={{ textAlign: 'right' }}
                                                readOnly={!infoPerusahaan.edit}
                                                id="kelipatanPoint"
                                                name="kelipatanPoint"
                                                min={0}
                                                value={formik.values.kelipatanPoint == '' ? 0 : formik.values.kelipatanPoint}
                                                onChange={(e) => formik.setFieldValue('kelipatanPoint', e.value == '' ? 0 : e.value)}
                                                className={isFormFieldInvalid('kelipatanPoint') ? 'p-invalid' : ''}
                                            />
                                        </div>
                                    ) : <div className="p-inputgroup">
                                        <InputNumber
                                            inputStyle={{ textAlign: 'right' }}
                                            readOnly={!infoPerusahaan.edit}
                                            id="minNPerStruk"
                                            name="minNPerStruk"
                                            min={0}
                                            value={formik.values.minNPerStruk == '' ? 0 : formik.values.minNPerStruk}
                                            onChange={(e) => formik.setFieldValue('minNPerStruk', e.value == '' ? 0 : e.value)}
                                            className={isFormFieldInvalid('minNPerStruk') ? 'p-invalid' : ''}
                                        />
                                    </div>}
                                    {isFormFieldInvalid('kelipatanPoint') && getFormErrorMessage('kelipatanPoint')}
                                    {isFormFieldInvalid('minNPerStruk') && getFormErrorMessage('minNPerStruk')}
                                </div>
                            </div>
                        </div>
                        {infoPerusahaan.edit ? <Button type="submit" label="Submit" /> : ''}
                    </form>
                </BlockUI>
            </div>
        </>
    );
};

export default Konfigurasi;
