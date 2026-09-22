'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import AdminSidebar from '@/components/admin/AdminSidebar';
import {
  Users,
  UserPlus,
  Search,
  Filter,
  Download,
  ArrowLeft,
  Edit2,
  Trash2,
  Eye,
  X,
  AlertTriangle,
  Loader2,
  Building2,
  ShieldCheck,
  CheckCircle2,
  Mail,
  Phone,
  GraduationCap,
  Calendar,
  Lock,
} from 'lucide-react';

interface College {
  id: number;
  folder_id: string;
  name: string;
  code: string;
}

interface Student {
  id: number;
  college_id: number;
  college_name?: string;
  name: string;
  roll_number: string;
  registration_number: string;
  email: string;
  mobile: string;
  department: string;
  branch: string;
  year: string;
  section: string;
  gender: string;
  dob: string;
  username: string;
  password_hash: string;
  created_at: string;
}

export default function StudentCredentialDataPage() {
  const params = useParams();
  const collegeId = params.id as string;

  const [college, setCollege] = useState<College | null>(null);
  const [students, setStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [search, setSearch] = useState('');
  const [departmentFilter, setDepartmentFilter] = useState('all');
  const [yearFilter, setYearFilter] = useState('all');

  // Modals
  const [isRegisterOpen, setIsRegisterOpen] = useState(false);
  const [regData, setRegData] = useState({
    name: '',
    roll_number: '',
    registration_number: '',
    email: '',
    mobile: '',
    department: 'Computer Science',
    branch: 'CSE',
    year: '4th Year',
    section: 'A',
    gender: 'Male',
    dob: '',
    username: '',
    password: '',
  });
  const [registering, setRegistering] = useState(false);
  const [regError, setRegError] = useState('');

  // View Details Modal
  const [viewStudent, setViewStudent] = useState<Student | null>(null);

  // Edit Modal
  const [editStudent, setEditStudent] = useState<Student | null>(null);
  const [editing, setEditing] = useState(false);

  // Delete Modal
  const [deleteTarget, setDeleteTarget] = useState<Student | null>(null);
  const [deleting, setDeleting] = useState(false);

  const fetchStudents = async () => {
    try {
      setLoading(true);
      const url = new URL(`/api/admin/folders/colleges/${collegeId}/students`, window.location.origin);
      if (search) url.searchParams.set('search', search);
      if (departmentFilter !== 'all') url.searchParams.set('department', departmentFilter);
      if (yearFilter !== 'all') url.searchParams.set('year', yearFilter);

      const res = await fetch(url.toString());
      const data = await res.json();
      if (data.success) {
        setCollege(data.college);
        setStudents(data.students || []);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (collegeId) fetchStudents();
  }, [collegeId, search, departmentFilter, yearFilter]);

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setRegError('');
    setRegistering(true);

    try {
      const res = await fetch(`/api/admin/folders/colleges/${collegeId}/students`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(regData),
      });
      const data = await res.json();
      if (data.success) {
        setIsRegisterOpen(false);
        setRegData({
          name: '',
          roll_number: '',
          registration_number: '',
          email: '',
          mobile: '',
          department: 'Computer Science',
          branch: 'CSE',
          year: '4th Year',
          section: 'A',
          gender: 'Male',
          dob: '',
          username: '',
          password: '',
        });
        fetchStudents();
      } else {
        setRegError(data.message || 'Failed to register student');
      }
    } catch (err: any) {
      setRegError(err?.message || 'Error occurred');
    } finally {
      setRegistering(false);
    }
  };

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editStudent) return;
    setEditing(true);

    try {
      const res = await fetch(`/api/admin/folders/colleges/${collegeId}/students`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          studentId: editStudent.id,
          ...editStudent,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setEditStudent(null);
        fetchStudents();
      } else {
        alert(data.message || 'Failed to update student');
      }
    } catch (err) {
      console.error(err);
    } finally {
      setEditing(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);

    try {
      const res = await fetch(`/api/admin/folders/colleges/${collegeId}/students?studentId=${deleteTarget.id}`, {
        method: 'DELETE',
      });
      const data = await res.json();
      if (data.success) {
        setDeleteTarget(null);
        fetchStudents();
      } else {
        alert(data.message || 'Failed to delete student');
      }
    } catch (err) {
      console.error(err);
    } finally {
      setDeleting(false);
    }
  };

  const exportCSV = () => {
    if (students.length === 0) return;
    const headers = ['Student Name', 'Roll Number', 'Registration No', 'Email', 'Mobile', 'Department', 'Branch', 'Year', 'Section', 'Gender', 'DOB', 'Username', 'Registered Date'];
    const rows = students.map((s) => [
      `"${s.name.replace(/"/g, '""')}"`,
      `"${s.roll_number}"`,
      `"${s.registration_number || ''}"`,
      `"${s.email}"`,
      `"${s.mobile || ''}"`,
      `"${s.department || ''}"`,
      `"${s.branch || ''}"`,
      `"${s.year || ''}"`,
      `"${s.section || ''}"`,
      `"${s.gender || ''}"`,
      `"${s.dob || ''}"`,
      `"${s.username || ''}"`,
      `"${new Date(s.created_at).toLocaleDateString()}"`,
    ]);

    const csvContent = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `${college?.name || 'College'}_Students_Credentials.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="min-h-screen bg-slate-50 flex">
      <AdminSidebar currentRole="Main Super Admin" />

      <main className="flex-1 lg:pl-64 flex flex-col min-w-0">
        {/* Glossy Top Bar */}
        <header className="glossy-header px-6 py-4 sticky top-0 z-30 flex items-center justify-between border-b border-slate-200/80">
          <div className="flex items-center space-x-3">
            <Link
              href={`/admin/folders/${collegeId}`}
              className="p-2 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-xl transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
            </Link>
            <div>
              <div className="flex items-center space-x-2 text-2xs font-bold text-slate-400 uppercase tracking-wider mb-0.5">
                <Link href="/admin/folders" className="hover:text-blue-600">Folders</Link>
                <span>/</span>
                <Link href={`/admin/folders/${collegeId}`} className="hover:text-blue-600">{college?.name || 'College'}</Link>
                <span>/</span>
                <span className="text-emerald-600 font-extrabold">Student Credential Data</span>
              </div>
              <h1 className="text-xl font-black text-slate-900 tracking-tight flex items-center space-x-2">
                <Users className="w-5 h-5 text-emerald-600" />
                <span>Student Credential Data</span>
              </h1>
            </div>
          </div>

          <div className="flex items-center space-x-2.5">
            <button
              onClick={exportCSV}
              disabled={students.length === 0}
              className="glossy-button-secondary text-slate-700 text-xs font-bold px-3.5 py-2 rounded-xl flex items-center space-x-1.5 disabled:opacity-50"
            >
              <Download className="w-4 h-4 text-slate-500" />
              <span>Export CSV</span>
            </button>

            <button
              onClick={() => setIsRegisterOpen(true)}
              className="glossy-button-primary text-white text-xs font-black px-4 py-2 rounded-xl flex items-center space-x-1.5 shadow-sm"
            >
              <UserPlus className="w-4 h-4" />
              <span>+ Register Student</span>
            </button>
          </div>
        </header>

        <div className="p-6 max-w-7xl w-full mx-auto space-y-5">
          {/* Search and Filters Bar */}
          <div className="glossy-panel p-4 rounded-2xl flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="relative w-full md:w-80">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search by name, roll no, email..."
                className="w-full pl-10 pr-4 py-2 text-xs font-bold text-slate-800 glossy-input rounded-xl"
              />
            </div>

            <div className="flex items-center space-x-3 w-full md:w-auto">
              <div className="flex items-center space-x-2">
                <span className="text-2xs font-extrabold uppercase text-slate-400">Dept:</span>
                <select
                  value={departmentFilter}
                  onChange={(e) => setDepartmentFilter(e.target.value)}
                  className="px-3 py-1.5 text-xs font-bold text-slate-800 glossy-input rounded-xl"
                >
                  <option value="all">All Departments</option>
                  <option value="Computer Science">Computer Science</option>
                  <option value="Information Technology">Information Technology</option>
                  <option value="Electronics">Electronics (ECE)</option>
                  <option value="Electrical">Electrical (EEE)</option>
                  <option value="Mechanical">Mechanical</option>
                </select>
              </div>

              <div className="flex items-center space-x-2">
                <span className="text-2xs font-extrabold uppercase text-slate-400">Year:</span>
                <select
                  value={yearFilter}
                  onChange={(e) => setYearFilter(e.target.value)}
                  className="px-3 py-1.5 text-xs font-bold text-slate-800 glossy-input rounded-xl"
                >
                  <option value="all">All Years</option>
                  <option value="1st Year">1st Year</option>
                  <option value="2nd Year">2nd Year</option>
                  <option value="3rd Year">3rd Year</option>
                  <option value="4th Year">4th Year</option>
                </select>
              </div>
            </div>
          </div>

          {/* Students Table */}
          <div className="glossy-card rounded-2xl overflow-hidden border border-slate-200/90 shadow-sm">
            <div className="px-6 py-4 bg-slate-50/80 border-b border-slate-200/80 flex items-center justify-between">
              <p className="text-xs font-black text-slate-800 uppercase tracking-wider">
                Registered Candidates ({students.length})
              </p>
              <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-100">
                Institutional Isolation Enabled
              </span>
            </div>

            {loading ? (
              <div className="py-20 flex flex-col items-center justify-center space-y-3">
                <Loader2 className="w-8 h-8 text-emerald-600 animate-spin" />
                <p className="text-xs font-bold text-slate-500">Loading Student Records...</p>
              </div>
            ) : students.length === 0 ? (
              <div className="py-16 text-center space-y-3">
                <Users className="w-12 h-12 text-slate-300 mx-auto" />
                <p className="text-sm font-bold text-slate-700">No student records found</p>
                <p className="text-xs text-slate-500">Register students using the "+ Register Student" button above.</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-100/70 text-2xs uppercase tracking-wider font-black text-slate-500 border-b border-slate-200">
                    <tr>
                      <th className="py-3 px-5">Student Name</th>
                      <th className="py-3 px-4">Roll Number</th>
                      <th className="py-3 px-4">Email & Mobile</th>
                      <th className="py-3 px-4">Dept / Branch</th>
                      <th className="py-3 px-4">Year & Sec</th>
                      <th className="py-3 px-4 text-center">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {students.map((student) => (
                      <tr key={student.id} className="hover:bg-slate-50/70 transition-colors">
                        <td className="py-3.5 px-5">
                          <div className="font-black text-slate-900">{student.name}</div>
                          <div className="text-[10px] text-slate-400 font-mono">ID: {student.username || student.roll_number}</div>
                        </td>

                        <td className="py-3.5 px-4 font-mono font-bold text-slate-800">
                          <span className="bg-slate-100 px-2 py-0.5 rounded border border-slate-200/80">
                            {student.roll_number}
                          </span>
                        </td>

                        <td className="py-3.5 px-4 space-y-0.5">
                          <div className="font-medium text-slate-700">{student.email}</div>
                          {student.mobile && (
                            <div className="text-[10px] text-slate-400">{student.mobile}</div>
                          )}
                        </td>

                        <td className="py-3.5 px-4 font-medium text-slate-700">
                          <div>{student.department || 'N/A'}</div>
                          <div className="text-[10px] text-indigo-600 font-bold">{student.branch}</div>
                        </td>

                        <td className="py-3.5 px-4 font-medium text-slate-700">
                          <div>{student.year || 'N/A'}</div>
                          {student.section && (
                            <div className="text-[10px] text-slate-400 font-bold">Sec: {student.section}</div>
                          )}
                        </td>

                        <td className="py-3.5 px-4 text-center">
                          <div className="inline-flex items-center space-x-1.5">
                            <button
                              onClick={() => setViewStudent(student)}
                              className="p-1.5 text-slate-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                              title="View Full Profile"
                            >
                              <Eye className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => setEditStudent(student)}
                              className="p-1.5 text-slate-500 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors"
                              title="Edit Student"
                            >
                              <Edit2 className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => setDeleteTarget(student)}
                              className="p-1.5 text-slate-500 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                              title="Delete Record"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </main>

      {/* REGISTER STUDENT MODAL */}
      {isRegisterOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="w-full max-w-2xl glossy-card rounded-3xl overflow-hidden shadow-2xl animate-in fade-in zoom-in-95 max-h-[90vh] flex flex-col">
            <div className="p-5 bg-gradient-to-r from-emerald-600 to-teal-700 text-white flex items-center justify-between shrink-0">
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-white/20 rounded-xl">
                  <UserPlus className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h3 className="text-base font-black">Register Student Credential</h3>
                  <p className="text-xs text-emerald-100">Directly associated with {college?.name}</p>
                </div>
              </div>
              <button
                onClick={() => setIsRegisterOpen(false)}
                className="p-1 text-white/80 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleRegister} className="p-6 space-y-4 overflow-y-auto flex-1">
              {regError && (
                <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-bold flex items-center space-x-2">
                  <AlertTriangle className="w-4 h-4 shrink-0" />
                  <span>{regError}</span>
                </div>
              )}

              {/* Locked College Banner */}
              <div className="p-3 bg-emerald-50/80 border border-emerald-200/80 rounded-xl flex items-center justify-between text-xs">
                <span className="font-bold text-slate-700">College Assignment:</span>
                <span className="font-black text-emerald-900 bg-white px-2.5 py-1 rounded-lg border border-emerald-200">
                  {college?.name}
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-2xs font-extrabold uppercase tracking-wider text-slate-700 mb-1">
                    Student Full Name <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={regData.name}
                    onChange={(e) => setRegData({ ...regData, name: e.target.value })}
                    placeholder="e.g. John Doe"
                    className="w-full px-3.5 py-2.5 rounded-xl text-xs font-bold glossy-input text-slate-900"
                    required
                  />
                </div>

                <div>
                  <label className="block text-2xs font-extrabold uppercase tracking-wider text-slate-700 mb-1">
                    Roll Number <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={regData.roll_number}
                    onChange={(e) => setRegData({ ...regData, roll_number: e.target.value })}
                    placeholder="e.g. 23HT1A0501"
                    className="w-full px-3.5 py-2.5 rounded-xl text-xs font-bold font-mono uppercase glossy-input text-slate-900"
                    required
                  />
                </div>

                <div>
                  <label className="block text-2xs font-extrabold uppercase tracking-wider text-slate-700 mb-1">
                    Registration Number (Optional)
                  </label>
                  <input
                    type="text"
                    value={regData.registration_number}
                    onChange={(e) => setRegData({ ...regData, registration_number: e.target.value })}
                    placeholder="e.g. REG2024001"
                    className="w-full px-3.5 py-2.5 rounded-xl text-xs font-medium glossy-input text-slate-900"
                  />
                </div>

                <div>
                  <label className="block text-2xs font-extrabold uppercase tracking-wider text-slate-700 mb-1">
                    Email Address <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="email"
                    value={regData.email}
                    onChange={(e) => setRegData({ ...regData, email: e.target.value })}
                    placeholder="student@college.edu"
                    className="w-full px-3.5 py-2.5 rounded-xl text-xs font-bold glossy-input text-slate-900"
                    required
                  />
                </div>

                <div>
                  <label className="block text-2xs font-extrabold uppercase tracking-wider text-slate-700 mb-1">
                    Mobile Number
                  </label>
                  <input
                    type="tel"
                    value={regData.mobile}
                    onChange={(e) => setRegData({ ...regData, mobile: e.target.value })}
                    placeholder="+91 9876543210"
                    className="w-full px-3.5 py-2.5 rounded-xl text-xs font-medium glossy-input text-slate-900"
                  />
                </div>

                <div>
                  <label className="block text-2xs font-extrabold uppercase tracking-wider text-slate-700 mb-1">
                    Department
                  </label>
                  <input
                    type="text"
                    value={regData.department}
                    onChange={(e) => setRegData({ ...regData, department: e.target.value })}
                    placeholder="Computer Science"
                    className="w-full px-3.5 py-2.5 rounded-xl text-xs font-medium glossy-input text-slate-900"
                  />
                </div>

                <div>
                  <label className="block text-2xs font-extrabold uppercase tracking-wider text-slate-700 mb-1">
                    Branch
                  </label>
                  <input
                    type="text"
                    value={regData.branch}
                    onChange={(e) => setRegData({ ...regData, branch: e.target.value })}
                    placeholder="CSE"
                    className="w-full px-3.5 py-2.5 rounded-xl text-xs font-medium uppercase glossy-input text-slate-900"
                  />
                </div>

                <div>
                  <label className="block text-2xs font-extrabold uppercase tracking-wider text-slate-700 mb-1">
                    Year & Section
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    <select
                      value={regData.year}
                      onChange={(e) => setRegData({ ...regData, year: e.target.value })}
                      className="px-3 py-2.5 rounded-xl text-xs font-medium glossy-input text-slate-900"
                    >
                      <option value="1st Year">1st Year</option>
                      <option value="2nd Year">2nd Year</option>
                      <option value="3rd Year">3rd Year</option>
                      <option value="4th Year">4th Year</option>
                    </select>
                    <input
                      type="text"
                      value={regData.section}
                      onChange={(e) => setRegData({ ...regData, section: e.target.value })}
                      placeholder="Sec A"
                      className="px-3 py-2.5 rounded-xl text-xs font-medium glossy-input text-slate-900 uppercase"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-2xs font-extrabold uppercase tracking-wider text-slate-700 mb-1">
                    Gender
                  </label>
                  <select
                    value={regData.gender}
                    onChange={(e) => setRegData({ ...regData, gender: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl text-xs font-medium glossy-input text-slate-900"
                  >
                    <option value="Male">Male</option>
                    <option value="Female">Female</option>
                    <option value="Other">Other</option>
                  </select>
                </div>

                <div>
                  <label className="block text-2xs font-extrabold uppercase tracking-wider text-slate-700 mb-1">
                    Date of Birth
                  </label>
                  <input
                    type="date"
                    value={regData.dob}
                    onChange={(e) => setRegData({ ...regData, dob: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl text-xs font-medium glossy-input text-slate-900"
                  />
                </div>
              </div>

              <div className="pt-4 border-t border-slate-100 flex items-center justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setIsRegisterOpen(false)}
                  className="px-4 py-2.5 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={registering}
                  className="glossy-button-primary text-white text-xs font-black px-5 py-2.5 rounded-xl flex items-center space-x-2 disabled:opacity-50 shadow-md"
                >
                  {registering ? <Loader2 className="w-4 h-4 animate-spin" /> : <UserPlus className="w-4 h-4" />}
                  <span>{registering ? 'Registering...' : 'Register Student'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* VIEW FULL STUDENT DETAILS MODAL */}
      {viewStudent && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="w-full max-w-lg glossy-card rounded-3xl overflow-hidden shadow-2xl p-6 space-y-5 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center space-x-3">
                <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-black text-base border border-emerald-100">
                  {viewStudent.name.charAt(0)}
                </div>
                <div>
                  <h3 className="text-base font-black text-slate-900">{viewStudent.name}</h3>
                  <p className="text-xs text-slate-500 font-mono font-bold">Roll: {viewStudent.roll_number}</p>
                </div>
              </div>
              <button onClick={() => setViewStudent(null)} className="p-1 text-slate-400 hover:text-slate-700">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="grid grid-cols-2 gap-3.5 text-xs">
              <div className="p-3 bg-slate-50 rounded-xl">
                <span className="text-2xs font-extrabold text-slate-400 uppercase">College</span>
                <p className="font-bold text-slate-900 mt-0.5">{viewStudent.college_name || college?.name}</p>
              </div>

              <div className="p-3 bg-slate-50 rounded-xl">
                <span className="text-2xs font-extrabold text-slate-400 uppercase">Registration No</span>
                <p className="font-bold text-slate-900 mt-0.5">{viewStudent.registration_number || 'N/A'}</p>
              </div>

              <div className="p-3 bg-slate-50 rounded-xl">
                <span className="text-2xs font-extrabold text-slate-400 uppercase">Email</span>
                <p className="font-bold text-slate-900 mt-0.5 truncate">{viewStudent.email}</p>
              </div>

              <div className="p-3 bg-slate-50 rounded-xl">
                <span className="text-2xs font-extrabold text-slate-400 uppercase">Mobile</span>
                <p className="font-bold text-slate-900 mt-0.5">{viewStudent.mobile || 'N/A'}</p>
              </div>

              <div className="p-3 bg-slate-50 rounded-xl">
                <span className="text-2xs font-extrabold text-slate-400 uppercase">Department & Branch</span>
                <p className="font-bold text-slate-900 mt-0.5">{viewStudent.department} ({viewStudent.branch})</p>
              </div>

              <div className="p-3 bg-slate-50 rounded-xl">
                <span className="text-2xs font-extrabold text-slate-400 uppercase">Year & Section</span>
                <p className="font-bold text-slate-900 mt-0.5">{viewStudent.year} - Sec {viewStudent.section || 'A'}</p>
              </div>

              <div className="p-3 bg-slate-50 rounded-xl">
                <span className="text-2xs font-extrabold text-slate-400 uppercase">Gender & DOB</span>
                <p className="font-bold text-slate-900 mt-0.5">{viewStudent.gender || 'N/A'} {viewStudent.dob ? `(${viewStudent.dob})` : ''}</p>
              </div>

              <div className="p-3 bg-slate-50 rounded-xl">
                <span className="text-2xs font-extrabold text-slate-400 uppercase">Registered Date</span>
                <p className="font-bold text-slate-900 mt-0.5">{new Date(viewStudent.created_at).toLocaleDateString()}</p>
              </div>
            </div>

            <div className="pt-2 text-right">
              <button
                onClick={() => setViewStudent(null)}
                className="px-4 py-2 rounded-xl bg-slate-100 text-slate-700 text-xs font-bold hover:bg-slate-200"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* EDIT STUDENT MODAL */}
      {editStudent && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="w-full max-w-lg glossy-card rounded-3xl overflow-hidden shadow-2xl p-6 space-y-4 animate-in fade-in zoom-in-95 max-h-[90vh] flex flex-col">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 shrink-0">
              <h3 className="text-base font-black text-slate-900">Edit Student Record</h3>
              <button onClick={() => setEditStudent(null)} className="p-1 text-slate-400 hover:text-slate-700">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleEditSubmit} className="space-y-4 overflow-y-auto flex-1">
              <div>
                <label className="block text-2xs font-extrabold uppercase text-slate-700 mb-1">Name</label>
                <input
                  type="text"
                  value={editStudent.name}
                  onChange={(e) => setEditStudent({ ...editStudent, name: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl text-xs font-bold glossy-input text-slate-900"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-2xs font-extrabold uppercase text-slate-700 mb-1">Roll Number</label>
                  <input
                    type="text"
                    value={editStudent.roll_number}
                    onChange={(e) => setEditStudent({ ...editStudent, roll_number: e.target.value })}
                    className="w-full px-3.5 py-2 rounded-xl text-xs font-bold uppercase glossy-input text-slate-900"
                    required
                  />
                </div>
                <div>
                  <label className="block text-2xs font-extrabold uppercase text-slate-700 mb-1">Email</label>
                  <input
                    type="email"
                    value={editStudent.email}
                    onChange={(e) => setEditStudent({ ...editStudent, email: e.target.value })}
                    className="w-full px-3.5 py-2 rounded-xl text-xs font-bold glossy-input text-slate-900"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-2xs font-extrabold uppercase text-slate-700 mb-1">Mobile</label>
                  <input
                    type="tel"
                    value={editStudent.mobile}
                    onChange={(e) => setEditStudent({ ...editStudent, mobile: e.target.value })}
                    className="w-full px-3.5 py-2 rounded-xl text-xs font-medium glossy-input text-slate-900"
                  />
                </div>
                <div>
                  <label className="block text-2xs font-extrabold uppercase text-slate-700 mb-1">Branch</label>
                  <input
                    type="text"
                    value={editStudent.branch}
                    onChange={(e) => setEditStudent({ ...editStudent, branch: e.target.value })}
                    className="w-full px-3.5 py-2 rounded-xl text-xs font-medium uppercase glossy-input text-slate-900"
                  />
                </div>
              </div>

              <div className="pt-3 flex items-center justify-end space-x-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setEditStudent(null)}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={editing}
                  className="glossy-button-primary text-white text-xs font-black px-5 py-2 rounded-xl disabled:opacity-50"
                >
                  {editing ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* DELETE CONFIRMATION MODAL */}
      {deleteTarget && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="w-full max-w-md glossy-card rounded-3xl p-6 space-y-4 shadow-2xl text-center">
            <div className="w-14 h-14 bg-rose-50 text-rose-600 rounded-2xl flex items-center justify-center mx-auto border border-rose-100">
              <AlertTriangle className="w-7 h-7" />
            </div>
            <div>
              <h3 className="text-base font-black text-slate-950">Delete Student Record?</h3>
              <p className="text-xs text-slate-500 mt-1">
                Are you sure you want to delete <strong className="text-slate-900">{deleteTarget.name}</strong> ({deleteTarget.roll_number})?
              </p>
            </div>

            <div className="pt-2 flex items-center justify-center space-x-3">
              <button
                type="button"
                onClick={() => setDeleteTarget(null)}
                className="px-4 py-2.5 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100 border border-slate-200"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleDelete}
                disabled={deleting}
                className="px-5 py-2.5 rounded-xl text-xs font-black text-white bg-rose-600 hover:bg-rose-700 transition-colors shadow-md disabled:opacity-50"
              >
                {deleting ? 'Deleting...' : 'Yes, Delete'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
