from __future__ import annotations

import json
import sys
from copy import deepcopy
from pathlib import Path

from jsonschema import Draft202012Validator, FormatChecker


ROOT = Path(__file__).resolve().parents[1]
SCHEMA_PATH = ROOT / "docs" / "contrato-v2g-teste-2026-10-13-v2.schema.json"
EXAMPLE_PATH = ROOT / "docs" / "contrato-v2g-teste-2026-10-13-v2.exemplo-ficticio.json"


def load_json(path: Path) -> dict:
    with path.open("r", encoding="utf-8") as stream:
        return json.load(stream)


def fail(message: str) -> None:
    raise ValueError(message)


def validate_cross_fields(document: dict) -> None:
    order = document["pedido"]
    units = document["unidades"]
    contract = document["contrato"]
    fiscal = document["fiscal"]

    if order["quantidade_de_contas"] != len(units):
        fail("pedido.quantidade_de_contas deve ser igual ao número de unidades")

    expected_total = order["quantidade_de_contas"] * order["valor_unitario_centavos"]
    if order["valor_total_centavos"] != expected_total:
        fail("pedido.valor_total_centavos não confere com quantidade x valor unitário")

    unit_ids = [unit["id"] for unit in units]
    ordinals = [unit["ordinal"] for unit in units]
    if len(unit_ids) != len(set(unit_ids)):
        fail("unidades não podem repetir id")
    if len(ordinals) != len(set(ordinals)):
        fail("unidades não podem repetir ordinal")

    if not any(signer["parte"] == "v2g" for signer in document["signatarios"]):
        fail("deve existir signatário da V2G")
    if not any(signer["parte"] == "contratante" for signer in document["signatarios"]):
        fail("deve existir signatário da contratante")

    for unit in units:
        if unit["estado_identificacao"] in {"identificada", "vinculada"} and not unit["conta_id_externo"]:
            fail("unidade identificada ou vinculada exige conta_id_externo")

    if contract["status_juridico"] != "not_approved":
        fail("pacote de teste não pode declarar aprovação jurídica")
    if contract["status_documento"] != "ready_for_review":
        fail("pacote de teste só aceita ready_for_review")
    if contract["provedor_assinatura"] is not None:
        fail("provedor de assinatura deve permanecer nulo no pacote de teste")
    if contract["automacao_assinatura_habilitada"]:
        fail("automação de assinatura deve permanecer bloqueada")
    if contract["publicacao_liberada"]:
        fail("publicação deve permanecer bloqueada")
    if fiscal["automacao_habilitada"]:
        fail("automação fiscal deve permanecer bloqueada")
    if fiscal["valor_mensal_confirmado"] or fiscal["competencia_confirmada"]:
        fail("exemplo não pode declarar parâmetros fiscais ainda não confirmados")


def expect_invalid_schema(validator: Draft202012Validator, document: dict, label: str) -> None:
    if not list(validator.iter_errors(document)):
        fail(f"caso negativo deveria falhar no schema: {label}")


def expect_invalid_cross(document: dict, label: str) -> None:
    try:
        validate_cross_fields(document)
    except ValueError:
        return
    fail(f"caso negativo deveria falhar nas travas cruzadas: {label}")


def validate_negative_cases(validator: Draft202012Validator, example: dict) -> None:
    wrong_price = deepcopy(example)
    wrong_price["pedido"]["valor_unitario_centavos"] = 50000
    expect_invalid_schema(validator, wrong_price, "preço mensal em plano semestral")

    signature_enabled = deepcopy(example)
    signature_enabled["contrato"]["automacao_assinatura_habilitada"] = True
    expect_invalid_schema(validator, signature_enabled, "automação de assinatura habilitada")

    publication_enabled = deepcopy(example)
    publication_enabled["contrato"]["publicacao_liberada"] = True
    expect_invalid_schema(validator, publication_enabled, "publicação liberada")

    fiscal_enabled = deepcopy(example)
    fiscal_enabled["fiscal"]["automacao_habilitada"] = True
    expect_invalid_schema(validator, fiscal_enabled, "automação fiscal habilitada")

    wrong_total = deepcopy(example)
    wrong_total["pedido"]["valor_total_centavos"] += 1
    expect_invalid_cross(wrong_total, "total divergente da quantidade")

    wrong_unit_count = deepcopy(example)
    wrong_unit_count["pedido"]["quantidade_de_contas"] = 1
    expect_invalid_cross(wrong_unit_count, "quantidade divergente das unidades")

    missing_external_account = deepcopy(example)
    missing_external_account["unidades"][0]["conta_id_externo"] = None
    expect_invalid_schema(validator, missing_external_account, "conta identificada sem id externo")


def main() -> int:
    schema = load_json(SCHEMA_PATH)
    example = load_json(EXAMPLE_PATH)

    Draft202012Validator.check_schema(schema)
    validator = Draft202012Validator(schema, format_checker=FormatChecker())
    errors = sorted(validator.iter_errors(example), key=lambda error: list(error.absolute_path))
    if errors:
        for error in errors:
            location = ".".join(str(part) for part in error.absolute_path) or "<raiz>"
            print(f"ERRO {location}: {error.message}", file=sys.stderr)
        return 1

    validate_cross_fields(example)
    validate_negative_cases(validator, example)
    print("OK: schema, exemplo, travas cruzadas e 7 casos negativos do pacote de teste estão válidos.")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
