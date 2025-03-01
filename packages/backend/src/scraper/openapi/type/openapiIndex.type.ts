/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable max-lines-per-function */

export type IndexRateId = '0001' | '1001' | 'FX@KRW';

export const IndexRateStockId: { [key: string]: IndexRateId } = {
  kospi: '0001',
  kosdaq: '1001',
  usd_krw: 'FX@KRW',
};

export type IndexRateGroupCode = 'INX' | 'RATE';
export const IndexRateGroupCodeStock: { [key: string]: IndexRateGroupCode } = {
  kospi: 'INX',
  kosdaq: 'INX',
  usd_krw: 'RATE',
};

export type ExchangeRateQuery = {
  fid_cond_mrkt_div_code: string;
  fid_input_date_1: string;
  fid_input_date_2: string;
  fid_input_iscd: string;
  fid_period_div_code: string;
};

export type ExchangeRate = {
  acml_vol: string;
  ovrs_nmix_prpr: string;
  ovrs_nmix_prdy_vrss: string;
  prdy_vrss_sign: string;
  prdy_ctrt: string;
  ovrs_nmix_prdy_clpr: string;
  hts_kor_isnm: string;
  stck_shrn_iscd: string;
  ovrs_prod_oprc: string;
  ovrs_prod_hgpr: string;
  ovrs_prod_lwpr: string;
};

export function isExchangeRate(data: any): data is ExchangeRate {
  return (
    data &&
    typeof data === 'object' &&
    typeof data.acml_vol === 'string' &&
    typeof data.ovrs_nmix_prpr === 'string' &&
    typeof data.ovrs_nmix_prdy_vrss === 'string' &&
    typeof data.prdy_vrss_sign === 'string' &&
    typeof data.prdy_ctrt === 'string' &&
    typeof data.ovrs_nmix_prdy_clpr === 'string' &&
    typeof data.hts_kor_isnm === 'string' &&
    typeof data.stck_shrn_iscd === 'string' &&
    typeof data.ovrs_prod_oprc === 'string' &&
    typeof data.ovrs_prod_hgpr === 'string' &&
    typeof data.ovrs_prod_lwpr === 'string'
  );
}

export type StockIndexQuery = {
  fid_cond_mrkt_div_code: string;
  fid_input_iscd: string;
};

export type StockIndex = {
  bstp_nmix_prpr: string;
  bstp_nmix_prdy_vrss: string;
  prdy_vrss_sign: string;
  bstp_nmix_prdy_ctrt: string;
  acml_vol: string;
  prdy_vol: string;
  acml_tr_pbmn: string;
  prdy_tr_pbmn: string;
  bstp_nmix_oprc: string;
  prdy_nmix_vrss_nmix_oprc: string;
  oprc_vrss_prpr_sign: string;
  bstp_nmix_oprc_prdy_ctrt: string;
  bstp_nmix_hgpr: string;
  prdy_nmix_vrss_nmix_hgpr: string;
  hgpr_vrss_prpr_sign: string;
  bstp_nmix_hgpr_prdy_ctrt: string;
  bstp_nmix_lwpr: string;
  prdy_clpr_vrss_lwpr: string;
  lwpr_vrss_prpr_sign: string;
  prdy_clpr_vrss_lwpr_rate: string;
  ascn_issu_cnt: string;
  uplm_issu_cnt: string;
  stnr_issu_cnt: string;
  down_issu_cnt: string;
  lslm_issu_cnt: string;
  dryy_bstp_nmix_hgpr: string;
  dryy_hgpr_vrss_prpr_rate: string;
  dryy_bstp_nmix_hgpr_date: string;
  dryy_bstp_nmix_lwpr: string;
  dryy_lwpr_vrss_prpr_rate: string;
  dryy_bstp_nmix_lwpr_date: string;
  total_askp_rsqn: string;
  total_bidp_rsqn: string;
  seln_rsqn_rate: string;
  shnu_rsqn_rate: string;
  ntby_rsqn: string;
};

export function isStockIndex(data: any): data is StockIndex {
  return (
    data &&
    typeof data === 'object' &&
    typeof data.bstp_nmix_prpr === 'string' &&
    typeof data.bstp_nmix_prdy_vrss === 'string' &&
    typeof data.prdy_vrss_sign === 'string' &&
    typeof data.bstp_nmix_prdy_ctrt === 'string' &&
    typeof data.acml_vol === 'string' &&
    typeof data.prdy_vol === 'string' &&
    typeof data.acml_tr_pbmn === 'string' &&
    typeof data.prdy_tr_pbmn === 'string' &&
    typeof data.bstp_nmix_oprc === 'string' &&
    typeof data.prdy_nmix_vrss_nmix_oprc === 'string' &&
    typeof data.oprc_vrss_prpr_sign === 'string' &&
    typeof data.bstp_nmix_oprc_prdy_ctrt === 'string' &&
    typeof data.bstp_nmix_hgpr === 'string' &&
    typeof data.prdy_nmix_vrss_nmix_hgpr === 'string' &&
    typeof data.hgpr_vrss_prpr_sign === 'string' &&
    typeof data.bstp_nmix_hgpr_prdy_ctrt === 'string' &&
    typeof data.bstp_nmix_lwpr === 'string' &&
    typeof data.prdy_clpr_vrss_lwpr === 'string' &&
    typeof data.lwpr_vrss_prpr_sign === 'string' &&
    typeof data.prdy_clpr_vrss_lwpr_rate === 'string' &&
    typeof data.ascn_issu_cnt === 'string' &&
    typeof data.uplm_issu_cnt === 'string' &&
    typeof data.stnr_issu_cnt === 'string' &&
    typeof data.down_issu_cnt === 'string' &&
    typeof data.lslm_issu_cnt === 'string' &&
    typeof data.dryy_bstp_nmix_hgpr === 'string' &&
    typeof data.dryy_hgpr_vrss_prpr_rate === 'string' &&
    typeof data.dryy_bstp_nmix_hgpr_date === 'string' &&
    typeof data.dryy_bstp_nmix_lwpr === 'string' &&
    typeof data.dryy_lwpr_vrss_prpr_rate === 'string' &&
    typeof data.dryy_bstp_nmix_lwpr_date === 'string' &&
    typeof data.total_askp_rsqn === 'string' &&
    typeof data.total_bidp_rsqn === 'string' &&
    typeof data.seln_rsqn_rate === 'string' &&
    typeof data.shnu_rsqn_rate === 'string' &&
    typeof data.ntby_rsqn === 'string'
  );
}
