import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { certificateApi } from '../../services/api';
import { CertificateVerificationResultDto } from '../../types';
import { LoadingSpinner } from '../../components/common/UIComponents';
import { CheckCircle2, XCircle, Award, Calendar, Building2, ExternalLink } from 'lucide-react';

export const CertificateVerifyPage: React.FC = () => {
  const { code } = useParams<{ code: string }>();
  const [result, setResult] = useState<CertificateVerificationResultDto | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (code) {
      verifyCode(code);
    }
  }, [code]);

  const verifyCode = async (verificationCode: string) => {
    try {
      setLoading(true);
      setError(null);
      const res = await certificateApi.verifyPublic(verificationCode);
      if (res.success && res.data) {
        setResult(res.data);
      } else {
        setError(res.message || 'Sertifikat tasdiqlanmadi');
      }
    } catch (err: any) {
      console.error('Verify error', err);
      setError("Ushbu maxsus kod bo'yicha sertifikat topilmadi yoki soxtalashtirilgan.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 via-white to-slate-100 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950 flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-lg bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-200/90 dark:border-slate-800 overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        {/* Top Accent Header */}
        <div className="h-3 bg-gradient-to-r from-amber-400 via-[#0050cb] to-emerald-400" />

        <div className="p-6 sm:p-8 space-y-6">
          <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-[#0050cb] text-white flex items-center justify-center font-bold text-lg">
                E
              </div>
              <span className="font-extrabold text-base text-slate-900 dark:text-white">
                EduFlow Verification
              </span>
            </div>
            <span className="text-[10px] uppercase font-bold text-slate-400 px-2 py-1 rounded bg-slate-100 dark:bg-slate-800">
              Rasmiy Tizim
            </span>
          </div>

          {loading ? (
            <div className="py-12">
              <LoadingSpinner text="Sertifikat haqiqiyligi tekshirilmoqda..." />
            </div>
          ) : result && result.isValid ? (
            <div className="space-y-6">
              {/* Valid Status Badge */}
              <div className="text-center p-4 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800">
                <CheckCircle2 className="w-12 h-12 text-emerald-500 mx-auto mb-2" />
                <h3 className="text-lg font-black text-emerald-900 dark:text-emerald-200">
                  Sertifikat Haqiqiy va Tasdiqlangan!
                </h3>
                <p className="text-xs text-emerald-700 dark:text-emerald-300 mt-0.5">
                  № {result.certificateNumber}
                </p>
              </div>

              {/* Certificate Details */}
              <div className="space-y-3 text-xs">
                <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 flex justify-between items-center">
                  <span className="text-slate-500">Bitiruvchi:</span>
                  <span className="font-extrabold text-sm text-slate-900 dark:text-white">
                    {result.studentName}
                  </span>
                </div>

                <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 flex justify-between items-center">
                  <span className="text-slate-500">Kurs / Fan:</span>
                  <span className="font-bold text-slate-900 dark:text-white">
                    {result.courseName}
                  </span>
                </div>

                {result.levelName && (
                  <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 flex justify-between items-center">
                    <span className="text-slate-500">O'zlashtirilgan daraja:</span>
                    <span className="font-bold text-slate-900 dark:text-white">
                      {result.levelName}
                    </span>
                  </div>
                )}

                {result.finalGrade && (
                  <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 flex justify-between items-center">
                    <span className="text-slate-500">Yakuniy natija:</span>
                    <span className="font-bold text-emerald-600">
                      {result.finalGrade} ball
                    </span>
                  </div>
                )}

                <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 flex justify-between items-center">
                  <span className="text-slate-500">Bergan O'quv Markazi:</span>
                  <span className="font-bold text-slate-900 dark:text-white">
                    {result.organizationName}
                  </span>
                </div>

                <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 flex justify-between items-center">
                  <span className="text-slate-500">Berilgan sana:</span>
                  <span className="font-medium text-slate-700 dark:text-slate-300">
                    {new Date(result.issueDate).toLocaleDateString('uz-UZ')}
                  </span>
                </div>
              </div>
            </div>
          ) : (
            <div className="text-center py-8 space-y-3">
              <XCircle className="w-14 h-14 text-rose-500 mx-auto" />
              <h3 className="text-base font-bold text-rose-900 dark:text-rose-200">
                Sertifikat Tasdiqlanmadi
              </h3>
              <p className="text-xs text-slate-500 max-w-sm mx-auto leading-relaxed">
                {error || "Kiritilgan tekshiruv kodi bo'yicha hech qanday ma'lumot topilmadi."}
              </p>
            </div>
          )}

          <div className="pt-4 border-t border-slate-100 dark:border-slate-800 text-center">
            <Link
              to="/login"
              className="text-xs font-bold text-[#0050cb] hover:underline"
            >
              EduFlow tizimiga kirish
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};
