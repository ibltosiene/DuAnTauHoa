const { Op } = require('sequelize')
const { sequelize } = require('../config/database')
const {
  ChuyenTau, LichChay, Tau, GaTau,
  ToaChuyen, LoaiToa, CauHinhToa, CauHinhGhe,
  DieuPhoi, LichTrinhThucTe, LichTrinhChuyen,
} = require('../models')

// ─── Dashboard ────────────────────────────────────────────────────────────────

const getChuyenTauByNgay = async (ngay) => {
  return ChuyenTau.findAll({
    where: { ngay_chay: ngay },
    include: [{
      model: LichChay,
      include: [
        { model: Tau, attributes: ['so_hieu', 'ten_tau'] },
        { model: GaTau, as: 'GaDi', attributes: ['ten_ga'] },
        { model: GaTau, as: 'GaDen', attributes: ['ten_ga'] },
      ],
    }],
    order: [[LichChay, 'gio_khoi_hanh', 'ASC']],
  })
}

const demChuyenTheoNgay = async (ngay) => {
  const rows = await sequelize.query(
    `EXEC sp_DP_DemChuyenTheoNgay @ngay = :ngay`,
    { replacements: { ngay }, type: sequelize.QueryTypes.SELECT }
  ).catch(() => sequelize.query(
    `SELECT COUNT(*) AS cnt FROM ChuyenTau WHERE ngay_chay='${ngay}' AND trang_thai<>'huy'`,
    { type: sequelize.QueryTypes.SELECT }
  ))
  return parseInt(rows[0]?.cnt ?? 0)
}

const getSuKienGanDay = async (gioTruoc = 24, topN = 10) => {
  return sequelize.query(
    `EXEC sp_DP_SuKienGanDay @gio_truoc = :gioTruoc, @top_n = :topN`,
    { replacements: { gioTruoc, topN }, type: sequelize.QueryTypes.SELECT }
  ).catch(() => sequelize.query(
    `SELECT dp.id_dieu_phoi, dp.id_chuyen, dp.loai_su_kien, dp.mo_ta,
             dp.delay_phut, dp.thoi_gian_tao,
             t.so_hieu AS ma_tau,
             ga.ten_ga AS ga_anh_huong
     FROM DieuPhoi dp
     LEFT JOIN ChuyenTau ct ON ct.id_chuyen = dp.id_chuyen
     LEFT JOIN LichChay lc  ON lc.id_lich_chay = ct.id_lich_chay
     LEFT JOIN Tau t         ON t.id_tau = lc.id_tau
     LEFT JOIN GaTau ga      ON ga.id_ga = dp.id_ga_anh_huong
     WHERE dp.thoi_gian_tao >= DATEADD(HOUR, -${gioTruoc}, DATEADD(HOUR, 7, GETUTCDATE()))
     ORDER BY dp.thoi_gian_tao DESC
     OFFSET 0 ROWS FETCH NEXT ${topN} ROWS ONLY`,
    { type: sequelize.QueryTypes.SELECT }
  ))
}

// ─── Danh sách chuyến (có phân trang + lọc) ──────────────────────────────────

const getChuyenTauList = async ({ ngay, ngayDen, trangThai, idTau, idLichChay, offset, limit }) => {
  let rows, count
  try {
    rows = await sequelize.query(
      `EXEC sp_DP_DanhSachChuyen @ngay = :ngay, @ngay_den = :ngayDen, @trang_thai = :trangThai,
         @id_tau = :idTau, @id_lich_chay = :idLichChay, @offset = :offset, @limit = :limit`,
      {
        replacements: {
          ngay: ngay || null, ngayDen: ngayDen || null, trangThai: trangThai || null,
          idTau: idTau ? parseInt(idTau) : null, idLichChay: idLichChay ? parseInt(idLichChay) : null,
          offset, limit,
        },
        type: sequelize.QueryTypes.SELECT,
      }
    )
    count = parseInt(rows[0]?.total_count ?? 0)
  } catch {
    const dateCond = (() => {
      if (ngay && ngayDen && ngay === ngayDen) return `ct.ngay_chay = '${ngay}'`
      if (ngay && ngayDen) return `ct.ngay_chay BETWEEN '${ngay}' AND '${ngayDen}'`
      if (ngay) return `ct.ngay_chay >= '${ngay}'`
      return '1=1'
    })()
    const statusCond = trangThai ? `AND ct.trang_thai = '${trangThai.replace(/'/g, "''")}'` : ''
    const tauCond = idTau ? `AND lc.id_tau = ${parseInt(idTau)}` : ''
    const lichCond = idLichChay ? `AND ct.id_lich_chay = ${parseInt(idLichChay)}` : ''

    const baseSql = `
      FROM ChuyenTau ct
      JOIN LichChay lc  ON lc.id_lich_chay = ct.id_lich_chay
      JOIN Tau tau       ON tau.id_tau = lc.id_tau
      JOIN GaTau gdi    ON gdi.id_ga = lc.id_ga_di
      JOIN GaTau gden   ON gden.id_ga = lc.id_ga_den
      WHERE ${dateCond} ${statusCond} ${tauCond} ${lichCond}
    `

    const [countRow] = await sequelize.query(`SELECT COUNT(*) AS cnt ${baseSql}`, { type: sequelize.QueryTypes.SELECT })
    count = parseInt(countRow?.cnt ?? 0)

    rows = await sequelize.query(
      `SELECT ct.id_chuyen, ct.id_lich_chay, ct.ngay_chay, ct.trang_thai, ct.ghi_chu,
              tau.id_tau, tau.so_hieu AS ma_tau, tau.ten_tau,
              gdi.id_ga AS id_ga_di, gdi.ten_ga AS ten_ga_di, gdi.ma_ga_viet_tat AS vt_ga_di,
              gden.id_ga AS id_ga_den, gden.ten_ga AS ten_ga_den, gden.ma_ga_viet_tat AS vt_ga_den,
              lc.gio_khoi_hanh, lc.gio_du_kien_den
       ${baseSql}
       ORDER BY ct.ngay_chay DESC, lc.gio_khoi_hanh ASC
       OFFSET ${offset} ROWS FETCH NEXT ${limit} ROWS ONLY`,
      { type: sequelize.QueryTypes.SELECT }
    )
  }
  return { rows, count }
}

const demVeTheoListChuyen = async (ids) => {
  if (!ids.length) return {}
  const idsStr = ids.join(',')
  const veCounts = await sequelize.query(
    `EXEC sp_DP_DemVeTheoDanhSachChuyen @ids = :ids`,
    { replacements: { ids: idsStr }, type: sequelize.QueryTypes.SELECT }
  ).catch(() => sequelize.query(
    `SELECT id_chuyen, COUNT(*) AS cnt FROM Ve WHERE id_chuyen IN (${idsStr}) AND trang_thai NOT IN ('da_huy','da_doi') GROUP BY id_chuyen`,
    { type: sequelize.QueryTypes.SELECT }
  ))
  return Object.fromEntries(veCounts.map(v => [v.id_chuyen, parseInt(v.cnt)]))
}

const getSuKienMoiNhatTheoListChuyen = async (ids) => {
  if (!ids.length) return {}
  const idsStr = ids.join(',')
  const evRaw = await sequelize.query(
    `EXEC sp_DP_SuKienMoiNhatTheoDanhSachChuyen @ids = :ids`,
    { replacements: { ids: idsStr }, type: sequelize.QueryTypes.SELECT }
  ).catch(() => sequelize.query(
    `SELECT id_chuyen, loai_su_kien, delay_phut, thoi_gian_tao
     FROM DieuPhoi WHERE id_chuyen IN (${idsStr})
       AND id_dieu_phoi IN (
         SELECT MAX(id_dieu_phoi) FROM DieuPhoi
         WHERE id_chuyen IN (${idsStr}) GROUP BY id_chuyen
       )`,
    { type: sequelize.QueryTypes.SELECT }
  ).catch(() => []))
  const map = {}
  evRaw.forEach(e => { map[e.id_chuyen] = e })
  return map
}

// ─── Chi tiết chuyến ──────────────────────────────────────────────────────────

const findChuyenById = async (idChuyen) => {
  return ChuyenTau.findByPk(idChuyen, {
    include: [{
      model: LichChay,
      include: [
        { model: Tau },
        { model: GaTau, as: 'GaDi' },
        { model: GaTau, as: 'GaDen' },
      ],
    }],
  })
}

const findChuyenWithLichChay = async (idChuyen) => {
  return ChuyenTau.findByPk(idChuyen, {
    include: [{
      model: LichChay,
      attributes: ['id_ga_di', 'id_lich_chay', 'gio_khoi_hanh'],
      include: [
        { model: Tau, attributes: ['so_hieu'] },
        { model: GaTau, as: 'GaDi', attributes: ['ten_ga'] },
      ],
    }],
  }).catch(() => null)
}

const ensureAndGetToaChuyen = async (idChuyen, idTau) => {
  try {
    return await sequelize.query(
      `EXEC sp_DP_EnsureToaChuyen @id_chuyen = ${parseInt(idChuyen)}`,
      { type: sequelize.QueryTypes.SELECT }
    )
  } catch {
    if (idTau) {
      const cauHinhToas = await CauHinhToa.findAll({
        where: { id_tau: idTau },
        include: [{ model: LoaiToa, attributes: ['so_cho_toi_da'] }],
        order: [['so_toa_thu_tu', 'ASC']],
      })
      if (cauHinhToas.length > 0) {
        const vals = cauHinhToas.map(cht =>
          `(${parseInt(idChuyen)}, ${cht.so_toa_thu_tu}, ${cht.id_loai_toa}, ${cht.LoaiToa?.so_cho_toi_da ?? 'NULL'}, 'hoat_dong')`
        ).join(',')
        await sequelize.query(
          `INSERT INTO ToaChuyen (id_chuyen, so_toa_thu_tu, id_loai_toa, so_ghe_toi_da, trang_thai) VALUES ${vals}`
        ).catch(() => {})
      }
    }
    return sequelize.query(
      `SELECT tc.id_toa_chuyen, tc.so_toa_thu_tu, tc.id_loai_toa, tc.so_ghe_toi_da, tc.trang_thai,
              lt.ten_loai_toa, lt.so_cho_toi_da AS loai_so_cho_toi_da
       FROM ToaChuyen tc LEFT JOIN LoaiToa lt ON lt.id_loai_toa = tc.id_loai_toa
       WHERE tc.id_chuyen = ${parseInt(idChuyen)} ORDER BY tc.so_toa_thu_tu`,
      { type: sequelize.QueryTypes.SELECT }
    )
  }
}

const getEventsByChuyen = async (idChuyen) => {
  return DieuPhoi.findAll({
    where: { id_chuyen: idChuyen },
    include: [{ model: GaTau, as: 'GaAnhHuong', attributes: ['ten_ga'], required: false }],
    order: [['thoi_gian_tao', 'DESC']],
  })
}

const demVeTheoToa = async (idChuyen) => {
  const veStats = await sequelize.query(
    `EXEC sp_DP_ThongKeVeTheoToa @id_chuyen = :idChuyen`,
    { replacements: { idChuyen: parseInt(idChuyen) }, type: sequelize.QueryTypes.SELECT }
  ).catch(() => sequelize.query(
    `SELECT so_toa_thu_tu, COUNT(*) AS ban
     FROM Ve WITH (NOLOCK)
     WHERE id_chuyen = ${parseInt(idChuyen)} AND trang_thai NOT IN ('da_huy','da_doi')
     GROUP BY so_toa_thu_tu`,
    { type: sequelize.QueryTypes.SELECT }
  ))
  return Object.fromEntries(veStats.map(r => [parseInt(r.so_toa_thu_tu), parseInt(r.ban)]))
}

const getLichTrinhByLichChay = async (idLichChay) => {
  return LichTrinhChuyen.findAll({
    where: { id_lich_chay: parseInt(idLichChay) },
    include: [{ model: GaTau, attributes: ['id_ga', 'ten_ga', 'ma_ga_viet_tat'] }],
    order: [['thu_tu_dung', 'ASC']],
  })
}

// ─── Sự kiện & cập nhật trạng thái ──────────────────────────────────────────

const updateTrangThaiChuyen = async (idChuyen, trangThai, ghiChu) => {
  const chuyen = await ChuyenTau.findByPk(idChuyen)
  if (!chuyen) return null
  await chuyen.update({ trang_thai: trangThai, ghi_chu: ghiChu || chuyen.ghi_chu })
  return chuyen
}

const ghiSuKien = async ({ idChuyen, loaiSuKien, moTa, delayPhut, idGaAnhHuong, soToa, nguoiTao }) => {
  try {
    const [result] = await sequelize.query(
      `EXEC sp_DP_GhiSuKien @id_chuyen = :idChuyen, @loai_su_kien = :loaiSuKien, @mo_ta = :moTa,
         @delay_phut = :delayPhut, @id_ga = :idGa, @so_toa = :soToa, @nguoi_tao = :nguoiTao`,
      {
        replacements: {
          idChuyen: parseInt(idChuyen), loaiSuKien,
          moTa: moTa ? String(moTa) : null,
          delayPhut: delayPhut ? parseInt(delayPhut) : null,
          idGa: idGaAnhHuong ? parseInt(idGaAnhHuong) : null,
          soToa: soToa ? parseInt(soToa) : null,
          nguoiTao,
        },
        type: sequelize.QueryTypes.SELECT,
      }
    )
    return result
  } catch {
    const dp = await DieuPhoi.create({
      id_chuyen: parseInt(idChuyen),
      loai_su_kien: loaiSuKien,
      mo_ta: moTa ? String(moTa) : null,
      id_ga_anh_huong: idGaAnhHuong ? parseInt(idGaAnhHuong) : null,
      delay_phut: delayPhut ? parseInt(delayPhut) : null,
      nguoi_tao: nguoiTao,
      thoi_gian_tao: new Date(),
      trang_thai: 'hieu_luc',
    })
    return { id_dieu_phoi: dp.id_dieu_phoi, message: 'Ghi nhận sự kiện thành công' }
  }
}

const capNhatLichTrinhTheoDelay = async ({ idChuyen, idLichChay, idGaTarget, delayInt, moTa }) => {
  const { addMinutesToTime } = require('../utils/dateUtils')

  const allStops = await LichTrinhChuyen.findAll({
    where: { id_lich_chay: idLichChay }, order: [['thu_tu_dung', 'ASC']],
  })
  const targetStop = allStops.find(s => s.id_ga === idGaTarget)
  const tuThuTuDung = targetStop?.thu_tu_dung ?? 1

  try {
    await sequelize.query(
      `EXEC sp_DP_CapNhatLichTrinhTheoDelay @id_chuyen = :idChuyen, @id_lich_chay = :idLichChay,
         @tu_thu_tu_dung = :tuThuTuDung, @delay_phut = :delayPhut, @ghi_chu = :ghiChu`,
      {
        replacements: { idChuyen: parseInt(idChuyen), idLichChay, tuThuTuDung, delayPhut: delayInt, ghiChu: moTa ? String(moTa) : null },
      }
    )
  } catch {
    const moTaSafe = moTa ? String(moTa).replace(/'/g, "''") : null
    const ghiChuSql = moTaSafe ? `, ghi_chu = N'${moTaSafe}'` : ''
    const ghiChuIns = moTaSafe ? `, N'${moTaSafe}'` : ', NULL'
    const affectedStops = allStops.filter(s => s.thu_tu_dung >= tuThuTuDung)

    if (affectedStops.length > 0) {
      const sqlBatch = affectedStops.map(s => {
        const gioDenDuKien = addMinutesToTime(s.gio_den, delayInt)
        const gioDiDuKien = addMinutesToTime(s.gio_di, delayInt)
        return `
          MERGE LichTrinhThucTe AS tgt
          USING (VALUES(${parseInt(idChuyen)}, ${s.id_ga})) AS src(id_chuyen, id_ga)
            ON tgt.id_chuyen = src.id_chuyen AND tgt.id_ga = src.id_ga
          WHEN MATCHED THEN
            UPDATE SET gio_den_du_kien = '${gioDenDuKien}', gio_di_du_kien = '${gioDiDuKien}',
                       delay_den_phut = ${delayInt}, delay_di_phut = ${delayInt}, trang_thai = 'delay'${ghiChuSql}
          WHEN NOT MATCHED THEN
            INSERT (id_chuyen, id_ga, thu_tu_dung, gio_den_du_kien, gio_di_du_kien, delay_den_phut, delay_di_phut, trang_thai, ghi_chu)
            VALUES (${parseInt(idChuyen)}, ${s.id_ga}, ${s.thu_tu_dung}, '${gioDenDuKien}', '${gioDiDuKien}', ${delayInt}, ${delayInt}, 'delay'${ghiChuIns});
        `
      }).join('\n')
      await sequelize.query(sqlBatch).catch(() => {})
    }
  }

  await ChuyenTau.update({ trang_thai: 'dieu_chinh' }, { where: { id_chuyen: idChuyen } }).catch(() => {})
}

// Gửi thông báo đến khách hàng có vé còn hiệu lực trên một chuyến.
// Ghi chú kiến trúc: dùng stored procedure sp_DP_ThongBaoKhachChuyen có sẵn ở
// CSDL (viết thẳng vào bảng ThongBao thuộc Notification Service) — đây là
// ngoại lệ thực dụng đã ghi trong kế hoạch tái cấu trúc (SP dùng chung DB),
// không phải Railway Service tự ý ghi dữ liệu ThongBao bằng ORM.
const notifyAffectedCustomers = async (idChuyen, { tieuDe, noiDung, loai }) => {
  try {
    const [result] = await sequelize.query(
      `EXEC sp_DP_ThongBaoKhachChuyen @id_chuyen = :idChuyen, @tieu_de = :tieuDe, @noi_dung = :noiDung, @loai = :loai`,
      { replacements: { idChuyen: parseInt(idChuyen), tieuDe, noiDung, loai }, type: sequelize.QueryTypes.SELECT }
    )
    return parseInt(result?.so_luong ?? 0)
  } catch {
    const accounts = await sequelize.query(
      `SELECT DISTINCT ddv.id_tai_khoan
       FROM Ve v WITH (NOLOCK)
       JOIN DonDatVe ddv WITH (NOLOCK) ON ddv.id_don_dat_ve = v.id_don_dat_ve
       WHERE v.id_chuyen = ${parseInt(idChuyen)}
         AND v.trang_thai NOT IN ('da_huy','da_doi')
         AND ddv.id_tai_khoan IS NOT NULL`,
      { type: sequelize.QueryTypes.SELECT }
    ).catch(() => [])
    if (accounts.length === 0) return 0

    const tieuDeSafe = tieuDe.replace(/'/g, "''")
    const noiDungSafe = noiDung.replace(/'/g, "''")
    const vals = accounts.map(a =>
      `(${a.id_tai_khoan}, N'${tieuDeSafe}', N'${noiDungSafe}', '${loai}', 0, '/tra-cuu-don', GETDATE())`
    ).join(',')
    await sequelize.query(
      `INSERT INTO ThongBao (id_tai_khoan, tieu_de, noi_dung, loai, da_doc, lien_ket, thoi_gian_tao) VALUES ${vals}`
    ).catch(e => console.warn('[notifyAffectedCustomers]', e.message))
    return accounts.length
  }
}

// Lấy email liên lạc của các đơn đặt vé còn hiệu lực trên một chuyến — dùng để
// gửi email báo sự kiện (kể cả đơn của khách đặt vé không cần tài khoản), khác
// với notifyAffectedCustomers ở trên chỉ báo ThongBao trong app cho tài khoản.
const getAffectedEmails = async (idChuyen) => {
  return sequelize.query(
    `SELECT DISTINCT ddv.email_dat_cho, ddv.ho_ten_lien_lac, ddv.ma_dat_cho
     FROM Ve v WITH (NOLOCK)
     JOIN DonDatVe ddv WITH (NOLOCK) ON ddv.id_don_dat_ve = v.id_don_dat_ve
     WHERE v.id_chuyen = ${parseInt(idChuyen)}
       AND v.trang_thai NOT IN ('da_huy','da_doi')
       AND ddv.email_dat_cho IS NOT NULL`,
    { type: sequelize.QueryTypes.SELECT }
  )
}

// ─── Quản lý ToaChuyen ────────────────────────────────────────────────────────

const triggerEnsureToaChuyen = async (idChuyen) => {
  await sequelize.query(`EXEC sp_DP_EnsureToaChuyen @id_chuyen = ${parseInt(idChuyen)}`).catch(() => {})
}

const findToaById = async (toaId) => ToaChuyen.findByPk(toaId)

const findToaBySoToa = async (idChuyen, soToaThuTu) => {
  return ToaChuyen.findOne({ where: { id_chuyen: parseInt(idChuyen), so_toa_thu_tu: parseInt(soToaThuTu) } })
}

const demVeTheoTuaToa = async (idChuyen, soToaThuTu) => {
  const [veCheck] = await sequelize.query(
    `EXEC sp_DP_DemVeTheoToa @id_chuyen = :idChuyen, @so_toa_thu_tu = :soToa`,
    { replacements: { idChuyen, soToa: soToaThuTu }, type: sequelize.QueryTypes.SELECT }
  ).catch(() => sequelize.query(
    `SELECT COUNT(*) AS cnt FROM Ve WITH (NOLOCK) WHERE id_chuyen=${idChuyen} AND so_toa_thu_tu=${soToaThuTu} AND trang_thai NOT IN ('da_huy','da_doi')`,
    { type: sequelize.QueryTypes.SELECT }
  ))
  return parseInt(veCheck?.cnt ?? 0)
}

const demVeTheoChuyen = async (idChuyen) => {
  const [veCheck] = await sequelize.query(
    `EXEC sp_DP_DemVeTheoChuyen @id_chuyen = :idChuyen`,
    { replacements: { idChuyen: parseInt(idChuyen) }, type: sequelize.QueryTypes.SELECT }
  ).catch(() => sequelize.query(
    `SELECT COUNT(*) AS cnt FROM Ve WITH (NOLOCK) WHERE id_chuyen=${parseInt(idChuyen)} AND trang_thai NOT IN ('da_huy','da_doi')`,
    { type: sequelize.QueryTypes.SELECT }
  ))
  return parseInt(veCheck?.cnt ?? 0)
}

const createToaChuyen = async ({ idChuyen, soToaThuTu, idLoaiToa, soGheToidDa }) => {
  return ToaChuyen.create({
    id_chuyen: parseInt(idChuyen),
    so_toa_thu_tu: parseInt(soToaThuTu),
    id_loai_toa: parseInt(idLoaiToa),
    so_ghe_toi_da: soGheToidDa ? parseInt(soGheToidDa) : null,
    trang_thai: 'hoat_dong',
  })
}

const dongBoGheChuyen = async (idChuyen) => {
  try {
    await sequelize.query(
      `EXEC sp_DP_DongBoGheChuyen @id_chuyen = :idChuyen`,
      { replacements: { idChuyen: parseInt(idChuyen) } }
    )
  } catch {
    const allToaList = await ToaChuyen.findAll({ where: { id_chuyen: parseInt(idChuyen) } })
    for (const toa of allToaList) {
      const ghes = await CauHinhGhe.findAll({ where: { id_loai_toa: toa.id_loai_toa } })
      if (ghes.length === 0) continue

      const existingGheNums = await sequelize.query(
        `SELECT so_ghe_trong_toa FROM GheChuyen WHERE id_chuyen=${parseInt(idChuyen)} AND so_toa_thu_tu=${toa.so_toa_thu_tu}`,
        { type: sequelize.QueryTypes.SELECT }
      )
      const existingSet = new Set(existingGheNums.map(g => g.so_ghe_trong_toa))
      const toCreate = ghes
        .filter(g => !existingSet.has(g.so_ghe_trong_toa))
        .map(g => ({
          id_chuyen: parseInt(idChuyen), so_toa_thu_tu: toa.so_toa_thu_tu,
          so_ghe_trong_toa: g.so_ghe_trong_toa, id_loai_ghe: g.id_loai_ghe,
        }))

      if (toCreate.length > 0) {
        await sequelize.query(
          `INSERT INTO GheChuyen(id_chuyen,so_toa_thu_tu,so_ghe_trong_toa,id_loai_ghe) VALUES ${
            toCreate.map(r => `(${r.id_chuyen},${r.so_toa_thu_tu},${r.so_ghe_trong_toa},${r.id_loai_ghe})`).join(',')
          }`
        )
      }
    }
  }
}

const hoanDoiToa = async ({ idToaChuyen1, soToaCu1, idToaChuyen2, soToaCu2 }) => {
  try {
    await sequelize.query(
      `EXEC sp_DP_HoanDoiToa @id_toa_chuyen_1 = :idToaChuyen1, @so_toa_cu_1 = :soToaCu1,
         @id_toa_chuyen_2 = :idToaChuyen2, @so_toa_cu_2 = :soToaCu2`,
      { replacements: { idToaChuyen1, soToaCu1, idToaChuyen2, soToaCu2 } }
    )
  } catch {
    await sequelize.transaction(async (t) => {
      await sequelize.query(`UPDATE ToaChuyen SET so_toa_thu_tu = -1          WHERE id_toa_chuyen = ${idToaChuyen1}`, { transaction: t })
      await sequelize.query(`UPDATE ToaChuyen SET so_toa_thu_tu = ${soToaCu1} WHERE id_toa_chuyen = ${idToaChuyen2}`, { transaction: t })
      await sequelize.query(`UPDATE ToaChuyen SET so_toa_thu_tu = ${soToaCu2} WHERE id_toa_chuyen = ${idToaChuyen1}`, { transaction: t })
    })
  }
}

const updateToa = async (tc, { newSoToa, newIdLoai, newSoGhe }) => {
  return tc.update({ so_toa_thu_tu: newSoToa, id_loai_toa: newIdLoai, so_ghe_toi_da: newSoGhe })
}

const reorderToa = async (idChuyen, order) => {
  await sequelize.transaction(async (t) => {
    for (const item of order) {
      await ToaChuyen.update(
        { so_toa_thu_tu: parseInt(item.soToaThuTu) },
        { where: { id_toa_chuyen: item.idToaChuyen, id_chuyen: parseInt(idChuyen) }, transaction: t }
      )
    }
  })
}

// ─── Lịch chạy ────────────────────────────────────────────────────────────────

const getLichChayList = async (idTau) => {
  const where = idTau ? { id_tau: parseInt(idTau) } : {}
  return LichChay.findAll({
    where,
    include: [
      { model: Tau, attributes: ['so_hieu', 'ten_tau'] },
      { model: GaTau, as: 'GaDi', attributes: ['id_ga', 'ten_ga', 'ma_ga_viet_tat'] },
      { model: GaTau, as: 'GaDen', attributes: ['id_ga', 'ten_ga', 'ma_ga_viet_tat'] },
    ],
    order: [['gio_khoi_hanh', 'ASC']],
  })
}

const findLichChayById = async (id) => LichChay.findByPk(id)

const createLichChay = async ({ idTau, idGaDi, idGaDen, gioKhoiHanh, gioDuKienDen, thuTrongTuan }) => {
  return LichChay.create({
    id_tau: parseInt(idTau), id_ga_di: parseInt(idGaDi), id_ga_den: parseInt(idGaDen),
    gio_khoi_hanh: gioKhoiHanh, gio_du_kien_den: gioDuKienDen,
    thu_trong_tuan: thuTrongTuan || null,
  })
}

const updateLichChay = async (lc, data) => lc.update(data)

const deleteLichChay = async (lc) => {
  await sequelize.transaction(async (t) => {
    await LichTrinhChuyen.destroy({ where: { id_lich_chay: lc.id_lich_chay }, transaction: t })
    await lc.destroy({ transaction: t })
  })
}

const countChuyenByLichChay = async (idLichChay) => {
  return ChuyenTau.count({ where: { id_lich_chay: idLichChay } })
}

// ─── Ga dừng (LichTrinhChuyen) ───────────────────────────────────────────────

const findGaDungById = async (id) => LichTrinhChuyen.findByPk(id)

const getGaDungList = async (idLichChay) => {
  return LichTrinhChuyen.findAll({
    where: { id_lich_chay: parseInt(idLichChay) },
    include: [{ model: GaTau, attributes: ['id_ga', 'ten_ga', 'ma_ga_viet_tat'] }],
    order: [['thu_tu_dung', 'ASC']],
  })
}

const getAllGaDungRaw = async (idLichChay, excludeId = null) => {
  const where = { id_lich_chay: idLichChay }
  if (excludeId) where.id_lich_trinh = { [Op.ne]: excludeId }
  return LichTrinhChuyen.findAll({ where })
}

const createGaDung = async ({ idLichChay, idGa, thuTuDung, gioDen, gioDi, khoangCachKm, thoiGianDung }) => {
  return LichTrinhChuyen.create({
    id_lich_chay: idLichChay,
    id_ga: parseInt(idGa),
    thu_tu_dung: parseInt(thuTuDung),
    gio_den: gioDen,
    gio_di: gioDi,
    khoang_cach_km: parseFloat(khoangCachKm),
    thoi_gian_dung: parseInt(thoiGianDung),
  })
}

const updateGaDung = async (row, { idGa, thuTuDung, gioDen, gioDi, khoangCachKm, thoiGianDung, deltaMin }) => {
  const { addMinutesToTime } = require('../utils/dateUtils')
  await sequelize.transaction(async (t) => {
    await row.update({
      id_ga: parseInt(idGa),
      thu_tu_dung: parseInt(thuTuDung),
      gio_den: gioDen,
      gio_di: gioDi,
      khoang_cach_km: parseFloat(khoangCachKm),
      thoi_gian_dung: parseInt(thoiGianDung),
    }, { transaction: t })

    if (deltaMin !== 0) {
      const subsequent = await LichTrinhChuyen.findAll({
        where: { id_lich_chay: row.id_lich_chay, thu_tu_dung: { [Op.gt]: parseInt(thuTuDung) } },
        transaction: t,
      })
      for (const s of subsequent) {
        await s.update({
          gio_den: addMinutesToTime(s.gio_den, deltaMin),
          gio_di: addMinutesToTime(s.gio_di, deltaMin),
        }, { transaction: t })
      }
    }
  })
}

// ─── Sinh chuyến tàu ─────────────────────────────────────────────────────────

const getExistingNgayChay = async (idLichChay, tuNgay, denNgay) => {
  const existing = await ChuyenTau.findAll({
    where: { id_lich_chay: idLichChay, ngay_chay: { [Op.between]: [tuNgay, denNgay] } },
    attributes: ['ngay_chay'],
  })
  return new Set(existing.map(c => String(c.ngay_chay).slice(0, 10)))
}

const bulkCreateChuyen = async (toCreate) => {
  if (toCreate.length > 0) await ChuyenTau.bulkCreate(toCreate)
}

// ─── Metadata ─────────────────────────────────────────────────────────────────

const getAllTau = async () => Tau.findAll({ order: [['so_hieu', 'ASC']] })
const getAllGa = async () => GaTau.findAll({ where: { trang_thai: 'hoat_dong' }, order: [['thu_tu_tuyen', 'ASC']] })
const getAllLoaiToa = async () => LoaiToa.findAll()
const findLoaiToaById = async (idLoaiToa) => LoaiToa.findByPk(idLoaiToa)

module.exports = {
  getChuyenTauByNgay, demChuyenTheoNgay, getSuKienGanDay,
  getChuyenTauList, demVeTheoListChuyen, getSuKienMoiNhatTheoListChuyen,
  findChuyenById, findChuyenWithLichChay, ensureAndGetToaChuyen,
  getEventsByChuyen, demVeTheoToa, getLichTrinhByLichChay,
  updateTrangThaiChuyen, ghiSuKien, capNhatLichTrinhTheoDelay, notifyAffectedCustomers, getAffectedEmails,
  triggerEnsureToaChuyen, findToaById, findToaBySoToa,
  demVeTheoTuaToa, demVeTheoChuyen,
  createToaChuyen, dongBoGheChuyen, hoanDoiToa, updateToa, reorderToa,
  getLichChayList, findLichChayById, createLichChay, updateLichChay, deleteLichChay, countChuyenByLichChay,
  findGaDungById, getGaDungList, getAllGaDungRaw, createGaDung, updateGaDung,
  getExistingNgayChay, bulkCreateChuyen,
  getAllTau, getAllGa, getAllLoaiToa, findLoaiToaById,
}
