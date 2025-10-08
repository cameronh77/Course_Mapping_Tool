import React, { useState } from 'react';

interface UnitFormProps {
    onSave: (data: UnitFormData) => void;
    initialData?: Partial<UnitFormData>;
}

export interface UnitFormData {
    unitId: string | null;
    unitName: string | null;
    unitDesc: string | null;
    credits: number | null;
    semestersOffered: number[] | null;
}

const UnitForm: React.FC<UnitFormProps> = ({ onSave, initialData }) => {
    const [form, setForm] = useState<UnitFormData>({
        unitId: initialData?.unitId || null,
        unitName: initialData?.unitName || null,
        unitDesc: initialData?.unitDesc || null,
        credits: initialData?.credits || null,
        semestersOffered: initialData?.semestersOffered || null,
    });


    const handleChange = (
        e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
    ) => {
        const { name, value } = e.target;
        setForm((prev) => ({
            ...prev,
            [name]: name === 'credits' ? Number(value) : value,
        }));
    };

    const handleSemestersChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const value = e.target.value;
        // Convert comma-separated string to array of numbers
        const semestersArray = value 
            ? value.split(',').map(s => Number(s.trim())).filter(n => !isNaN(n))
            : null;
            
        setForm((prev) => ({
            ...prev,
            semestersOffered: semestersArray,
        }));
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onSave(form);
    };

    return (
        <form onSubmit={handleSubmit}>
            <div>
                <label>
                    Unit Id:
                    <input
                        type="text"
                        name="unitId"
                        value={form.unitId || ''}
                        onChange={handleChange}
                        required
                    />
                </label>
            </div>
            <div>
                <label>
                    Unit Name:
                    <input
                        type="text"
                        name="unitName"
                        value={form.unitName || ''}
                        onChange={handleChange}
                        required
                    />
                </label>
            </div>
            <div>
                <label>
                    Unit Description:
                    <textarea
                        name="unitDesc"
                        value={form.unitDesc || ''}
                        onChange={handleChange}
                        required
                    />
                </label>
            </div>
            <div>
                <label>
                    Credits:
                    <input
                        type="number"
                        name="credits"
                        value={form.credits || 0}
                        onChange={handleChange}
                        min={0}
                        required
                    />
                </label>
            </div>
            <div>
                <label>
                    Semesters Offered:
                    <input
                        type="text"
                        name="semestersOffered"
                        value={form.semestersOffered?.join(', ') || ''}
                        onChange={handleSemestersChange}
                        placeholder="e.g., 1, 2"
                        required
                    />
                </label>
            </div>
            <button type="submit">Save</button>
        </form>
    );
};

export default UnitForm;