"use client";

import { useEffect, useMemo, useState } from "react";
import { Bm173FormInputsPanel } from "./bm-173-form-inputs";
import { Bm171FormInputsPanel } from "./bm-171-form-inputs";
import { Bm091FormInputsPanel } from "@/components/documents/bm-091-form-inputs";
import { Bm092FormInputsPanel } from "@/components/documents/bm-092-form-inputs";
import { Bm099FormInputsPanel } from "@/components/documents/bm-099-form-inputs";
import { Bm101FormInputsPanel } from "@/components/documents/bm-101-form-inputs";
import { Bm102FormInputsPanel } from "@/components/documents/bm-102-form-inputs";
import { Bm107FormInputsPanel } from "@/components/documents/bm-107-form-inputs";
import { Bm116FormInputsPanel } from "@/components/documents/bm-116-form-inputs";
import { Bm119FormInputsPanel } from "@/components/documents/bm-119-form-inputs";
import { Bm120FormInputsPanel } from "@/components/documents/bm-120-form-inputs";
import { Bm126FormInputsPanel } from "@/components/documents/bm-126-form-inputs";
import { Bm134FormInputsPanel } from "@/components/documents/bm-134-form-inputs";
import { Bm135FormInputsPanel } from "@/components/documents/bm-135-form-inputs";
import { Bm053FormInputsPanel } from "@/components/documents/bm-053-form-inputs";
import { Bm054FormInputsPanel } from "@/components/documents/bm-054-form-inputs";
import { Bm055FormInputsPanel } from "@/components/documents/bm-055-form-inputs";
import { Bm056FormInputsPanel } from "@/components/documents/bm-056-form-inputs";
import { Bm057FormInputsPanel } from "@/components/documents/bm-057-form-inputs";
import { Bm058FormInputsPanel } from "@/components/documents/bm-058-form-inputs";
import { Bm059FormInputsPanel } from "@/components/documents/bm-059-form-inputs";
import { Bm070FormInputsPanel } from "@/components/documents/bm-070-form-inputs";
import { Bm071FormInputsPanel } from "@/components/documents/bm-071-form-inputs";
import { Bm072FormInputsPanel } from "@/components/documents/bm-072-form-inputs";
import { Bm074FormInputsPanel } from "@/components/documents/bm-074-form-inputs";
import { Bm076FormInputsPanel } from "@/components/documents/bm-076-form-inputs";
import { Bm078FormInputsPanel } from "@/components/documents/bm-078-form-inputs";
import { Bm081FormInputsPanel } from "@/components/documents/bm-081-form-inputs";
import { Bm083FormInputsPanel } from "@/components/documents/bm-083-form-inputs";
import { Bm084FormInputsPanel } from "@/components/documents/bm-084-form-inputs";
import { Bm103FormInputsPanel } from "@/components/documents/bm-103-form-inputs";
import { Bm104FormInputsPanel } from "@/components/documents/bm-104-form-inputs";
import { Bm002FormInputsPanel } from "@/components/documents/bm-002-form-inputs";
import { Bm001FormInputsPanel } from "@/components/documents/bm-001-form-inputs";
import { Bm003FormInputsPanel } from "@/components/documents/bm-003-form-inputs";
import { Bm007FormInputsPanel } from "@/components/documents/bm-007-form-inputs";
import { Bm011FormInputsPanel } from "@/components/documents/bm-011-form-inputs";
import { Bm014FormInputsPanel } from "@/components/documents/bm-014-form-inputs";
import { Bm015FormInputsPanel } from "@/components/documents/bm-015-form-inputs";
import { Bm016FormInputsPanel } from "@/components/documents/bm-016-form-inputs";
import { Bm018FormInputsPanel } from "@/components/documents/bm-018-form-inputs";
import { Bm086FormInputsPanel } from "@/components/documents/bm-086-form-inputs";
import { Bm087FormInputsPanel } from "@/components/documents/bm-087-form-inputs";
import { Bm159FormInputsPanel } from "@/components/documents/bm-159-form-inputs";
import { Bm046FormInputsPanel } from "@/components/documents/bm-046-form-inputs";
import { Bm047FormInputsPanel } from "@/components/documents/bm-047-form-inputs";
import { Bm170FormInputsPanel } from "@/components/documents/bm-170-form-inputs";
import { Bm030FormInputsPanel } from "@/components/documents/bm-030-form-inputs";
import { Bm005FormInputsPanel } from "@/components/documents/bm-005-form-inputs";
import { Bm006FormInputsPanel } from "@/components/documents/bm-006-form-inputs";
import { Bm008FormInputsPanel } from "@/components/documents/bm-008-form-inputs";
import { Bm010FormInputsPanel } from "@/components/documents/bm-010-form-inputs";
import { Bm012FormInputsPanel } from "@/components/documents/bm-012-form-inputs";
import { Bm009FormInputsPanel } from "@/components/documents/bm-009-form-inputs";
import { Bm017FormInputsPanel } from "@/components/documents/bm-017-form-inputs";
import { Bm085FormInputsPanel } from "@/components/documents/bm-085-form-inputs";
import { Bm168FormInputsPanel } from "@/components/documents/bm-168-form-inputs";
import { Bm023FormInputsPanel } from "@/components/documents/bm-023-form-inputs";
import { Bm031FormInputsPanel } from "@/components/documents/bm-031-form-inputs";
import { Bm033FormInputsPanel } from "@/components/documents/bm-033-form-inputs";
import { Bm037FormInputsPanel } from "@/components/documents/bm-037-form-inputs";
import { Bm038FormInputsPanel } from "@/components/documents/bm-038-form-inputs";
import { Bm039FormInputsPanel } from "@/components/documents/bm-039-form-inputs";
import { Bm044FormInputsPanel } from "@/components/documents/bm-044-form-inputs";
import { Bm045FormInputsPanel } from "@/components/documents/bm-045-form-inputs";
import { Bm040FormInputsPanel } from "@/components/documents/bm-040-form-inputs";
import { Bm042FormInputsPanel } from "@/components/documents/bm-042-form-inputs";
import { Bm043FormInputsPanel } from "@/components/documents/bm-043-form-inputs";
import { Bm090FormInputsPanel } from "@/components/documents/bm-090-form-inputs";
import { Bm097FormInputsPanel } from "@/components/documents/bm-097-form-inputs";
import { Bm141FormInputsPanel } from "@/components/documents/bm-141-form-inputs";
import { Bm144FormInputsPanel } from "@/components/documents/bm-144-form-inputs";
import { Bm145FormInputsPanel } from "@/components/documents/bm-145-form-inputs";
import { Bm146FormInputsPanel } from "@/components/documents/bm-146-form-inputs";
import { Bm148FormInputsPanel } from "@/components/documents/bm-148-form-inputs";
import { Bm156FormInputsPanel } from "@/components/documents/bm-156-form-inputs";
import { Bm150FormInputsPanel } from "./bm-150-form-inputs";
import { Bm166FormInputsPanel } from "./bm-166-form-inputs";
import { Bm169FormInputsPanel } from "./bm-169-form-inputs";
import { Bm172FormInputs } from "./bm-172-form-inputs";
import { Bm088FormInputsPanel } from "./bm-088-form-inputs";
import { Bm089FormInputsPanel } from "./bm-089-form-inputs";
import { Bm093FormInputsPanel } from "./bm-093-form-inputs";
import { Bm094FormInputsPanel } from "./bm-094-form-inputs";
import { Bm095FormInputsPanel } from "./bm-095-form-inputs";
import { Bm096FormInputsPanel } from "./bm-096-form-inputs";
import { Bm098FormInputsPanel } from "./bm-098-form-inputs";
import { Bm100FormInputsPanel } from "./bm-100-form-inputs";
import { Bm105FormInputsPanel } from "./bm-105-form-inputs";
import { Bm106FormInputsPanel } from "./bm-106-form-inputs";
import { Bm108FormInputsPanel } from "./bm-108-form-inputs";
import { Bm109FormInputsPanel } from "./bm-109-form-inputs";
import { Bm110FormInputsPanel } from "./bm-110-form-inputs";
import { Bm111FormInputsPanel } from "./bm-111-form-inputs";
import { Bm112FormInputsPanel } from "./bm-112-form-inputs";
import { Bm113FormInputsPanel } from "./bm-113-form-inputs";
import { Bm114FormInputsPanel } from "./bm-114-form-inputs";
import { Bm115FormInputsPanel } from "./bm-115-form-inputs";
import { Bm117FormInputsPanel } from "./bm-117-form-inputs";
import { Bm118FormInputsPanel } from "./bm-118-form-inputs";
import { Bm121FormInputsPanel } from "./bm-121-form-inputs";
import { Bm122FormInputsPanel } from "./bm-122-form-inputs";
import { Bm125FormInputsPanel } from "./bm-125-form-inputs";
import { Bm127FormInputsPanel } from "./bm-127-form-inputs";
import { Bm128FormInputsPanel } from "./bm-128-form-inputs";
import { Bm129FormInputsPanel } from "./bm-129-form-inputs";
import { Bm130FormInputsPanel } from "./bm-130-form-inputs";
import { Bm131FormInputsPanel } from "./bm-131-form-inputs";
import { Bm132FormInputsPanel } from "./bm-132-form-inputs";
import { Bm133FormInputsPanel } from "./bm-133-form-inputs";
import { Bm138FormInputsPanel } from "./bm-138-form-inputs";
import { Bm142FormInputsPanel } from "./bm-142-form-inputs";
import { Bm143FormInputsPanel } from "./bm-143-form-inputs";
import { Bm147FormInputsPanel } from "./bm-147-form-inputs";
import { Bm149FormInputsPanel } from "./bm-149-form-inputs";
import { Bm151FormInputsPanel } from "./bm-151-form-inputs";
import { Bm152FormInputsPanel } from "./bm-152-form-inputs";
import { Bm153FormInputsPanel } from "./bm-153-form-inputs";
import { Bm154FormInputsPanel } from "./bm-154-form-inputs";
import { Bm155FormInputsPanel } from "./bm-155-form-inputs";
import { Bm157FormInputsPanel } from "./bm-157-form-inputs";
import { Bm158FormInputsPanel } from "./bm-158-form-inputs";
import { Bm160FormInputsPanel } from "./bm-160-form-inputs";
import { Bm161FormInputsPanel } from "./bm-161-form-inputs";
import { Bm123FormInputsPanel } from "./bm-123-form-inputs";
import { Bm124FormInputsPanel } from "./bm-124-form-inputs";
import { Bm136FormInputsPanel } from "./bm-136-form-inputs";
import { Bm137FormInputsPanel } from "./bm-137-form-inputs";
import { Bm139FormInputsPanel } from "./bm-139-form-inputs";
import { Bm140FormInputsPanel } from "./bm-140-form-inputs";
import { GeneratedDocumentActionPanel } from "@/components/documents/generated-document-action-panel";
import { GenericTemplateFormInputsPanel } from "@/components/documents/generic-template-form-inputs";
import { absoluteApiUrl } from "@/lib/api-client";
import { CasePayloadProvider } from "@/lib/case-payload-context";
import {
  buildCasePayloadFromRenderPayload,
  type RenderPayloadForCaseContext,
} from "@/lib/case-payload-normalizer";

import { Bm004FormInputsPanel } from "@/components/documents/bm-004-form-inputs";
import { Bm013FormInputsPanel } from "@/components/documents/bm-013-form-inputs";
import { Bm019FormInputsPanel } from "@/components/documents/bm-019-form-inputs";
import { Bm020FormInputsPanel } from "@/components/documents/bm-020-form-inputs";
import { Bm021FormInputsPanel } from "@/components/documents/bm-021-form-inputs";
import { Bm022FormInputsPanel } from "@/components/documents/bm-022-form-inputs";
import { Bm024FormInputsPanel } from "@/components/documents/bm-024-form-inputs";
import { Bm025FormInputsPanel } from "@/components/documents/bm-025-form-inputs";
import { Bm026FormInputsPanel } from "@/components/documents/bm-026-form-inputs";
import { Bm027FormInputsPanel } from "@/components/documents/bm-027-form-inputs";
import { Bm028FormInputsPanel } from "@/components/documents/bm-028-form-inputs";
import { Bm029FormInputsPanel } from "@/components/documents/bm-029-form-inputs";
import { Bm032FormInputsPanel } from "@/components/documents/bm-032-form-inputs";
import { Bm034FormInputsPanel } from "@/components/documents/bm-034-form-inputs";
import { Bm035FormInputsPanel } from "@/components/documents/bm-035-form-inputs";
import { Bm036FormInputsPanel } from "@/components/documents/bm-036-form-inputs";
import { Bm041FormInputsPanel } from "@/components/documents/bm-041-form-inputs";
import { Bm048FormInputsPanel } from "@/components/documents/bm-048-form-inputs";
import { Bm049FormInputsPanel } from "@/components/documents/bm-049-form-inputs";
import { Bm050FormInputsPanel } from "@/components/documents/bm-050-form-inputs";
import { Bm051FormInputsPanel } from "@/components/documents/bm-051-form-inputs";
import { Bm052FormInputsPanel } from "@/components/documents/bm-052-form-inputs";
import { Bm060FormInputsPanel } from "@/components/documents/bm-060-form-inputs";
import { Bm061FormInputsPanel } from "@/components/documents/bm-061-form-inputs";
import { Bm062FormInputsPanel } from "@/components/documents/bm-062-form-inputs";
import { Bm063FormInputsPanel } from "@/components/documents/bm-063-form-inputs";
import { Bm064FormInputsPanel } from "@/components/documents/bm-064-form-inputs";
import { Bm065FormInputsPanel } from "@/components/documents/bm-065-form-inputs";
import { Bm066FormInputsPanel } from "@/components/documents/bm-066-form-inputs";
import { Bm067FormInputsPanel } from "@/components/documents/bm-067-form-inputs";
import { Bm068FormInputsPanel } from "@/components/documents/bm-068-form-inputs";
import { Bm069FormInputsPanel } from "@/components/documents/bm-069-form-inputs";
import { Bm073FormInputsPanel } from "@/components/documents/bm-073-form-inputs";
import { Bm075FormInputsPanel } from "@/components/documents/bm-075-form-inputs";
import { Bm077FormInputsPanel } from "@/components/documents/bm-077-form-inputs";
import { Bm079FormInputsPanel } from "@/components/documents/bm-079-form-inputs";
import { Bm080FormInputsPanel } from "@/components/documents/bm-080-form-inputs";
import { Bm082FormInputsPanel } from "@/components/documents/bm-082-form-inputs";
import { Bm162FormInputsPanel } from "@/components/documents/bm-162-form-inputs";
import { Bm163FormInputsPanel } from "@/components/documents/bm-163-form-inputs";
import { Bm164FormInputsPanel } from "@/components/documents/bm-164-form-inputs";
import { Bm165FormInputsPanel } from "@/components/documents/bm-165-form-inputs";
import { Bm167FormInputsPanel } from "@/components/documents/bm-167-form-inputs";
import { Bm174FormInputsPanel } from "@/components/documents/bm-174-form-inputs";
import { Bm175FormInputsPanel } from "@/components/documents/bm-175-form-inputs";
import { Bm176FormInputsPanel } from "@/components/documents/bm-176-form-inputs";
import { Bm177FormInputsPanel } from "@/components/documents/bm-177-form-inputs";
import { Bm178FormInputsPanel } from "@/components/documents/bm-178-form-inputs";
import { Bm179FormInputsPanel } from "@/components/documents/bm-179-form-inputs";
import { Bm180FormInputsPanel } from "@/components/documents/bm-180-form-inputs";
import { Bm181FormInputsPanel } from "@/components/documents/bm-181-form-inputs";
import { Bm182FormInputsPanel } from "@/components/documents/bm-182-form-inputs";
import { Bm183FormInputsPanel } from "@/components/documents/bm-183-form-inputs";
import { Bm184FormInputsPanel } from "@/components/documents/bm-184-form-inputs";
import { Bm185FormInputsPanel } from "@/components/documents/bm-185-form-inputs";
import { Bm186FormInputsPanel } from "@/components/documents/bm-186-form-inputs";
import { Bm187FormInputsPanel } from "@/components/documents/bm-187-form-inputs";
import { Bm188FormInputsPanel } from "@/components/documents/bm-188-form-inputs";
import { Bm189FormInputsPanel } from "@/components/documents/bm-189-form-inputs";
import { Bm190FormInputsPanel } from "@/components/documents/bm-190-form-inputs";
import { Bm191FormInputsPanel } from "@/components/documents/bm-191-form-inputs";
import { Bm192FormInputsPanel } from "@/components/documents/bm-192-form-inputs";
import { Bm193FormInputsPanel } from "@/components/documents/bm-193-form-inputs";
import { Bm194FormInputsPanel } from "@/components/documents/bm-194-form-inputs";
import { Bm195FormInputsPanel } from "@/components/documents/bm-195-form-inputs";
import { Bm196FormInputsPanel } from "@/components/documents/bm-196-form-inputs";
import { Bm197FormInputsPanel } from "@/components/documents/bm-197-form-inputs";
import { Bm198FormInputsPanel } from "@/components/documents/bm-198-form-inputs";
import { Bm199FormInputsPanel } from "@/components/documents/bm-199-form-inputs";
import { Bm200FormInputsPanel } from "@/components/documents/bm-200-form-inputs";
import { Bm201FormInputsPanel } from "@/components/documents/bm-201-form-inputs";
import { Bm202FormInputsPanel } from "@/components/documents/bm-202-form-inputs";
import { Bm203FormInputsPanel } from "@/components/documents/bm-203-form-inputs";
import { Bm204FormInputsPanel } from "@/components/documents/bm-204-form-inputs";
import { Bm205FormInputsPanel } from "@/components/documents/bm-205-form-inputs";
import { Bm206FormInputsPanel } from "@/components/documents/bm-206-form-inputs";
import { Bm207FormInputsPanel } from "@/components/documents/bm-207-form-inputs";
import { Bm208FormInputsPanel } from "@/components/documents/bm-208-form-inputs";
import { Bm209FormInputsPanel } from "@/components/documents/bm-209-form-inputs";
import { Bm210FormInputsPanel } from "@/components/documents/bm-210-form-inputs";
import { Bm211FormInputsPanel } from "@/components/documents/bm-211-form-inputs";
import { Bm212FormInputsPanel } from "@/components/documents/bm-212-form-inputs";
import { Bm213FormInputsPanel } from "@/components/documents/bm-213-form-inputs";
type GeneratedDocumentWorkspaceProps = {
  documentId: string;
};

type TabKey = "form" | "files" | "history";

type RenderPayloadResponse = RenderPayloadForCaseContext & {
  document?: {
    id?: string | null;
    documentTitle?: string | null;
    documentCode?: string | null;
    targetScope?: string | null;
    reviewStatus?: string | null;
  } | null;
  template?: {
    id?: string | null;
    templateCode?: string | null;
    templateNo?: string | null;
    templateName?: string | null;
    renderScope?: string | null;
    outputStrategy?: string | null;
  } | null;
  person?: {
    fullName?: string | null;
  } | null;
};

const TABS: Array<{
  key: TabKey;
  label: string;
  description: string;
}> = [
    {
      key: "form",
      label: "Dữ liệu biểu mẫu",
      description: "Nhập dữ liệu riêng theo từng loại biểu mẫu",
    },
    {
      key: "files",
      label: "Tệp đã xuất",
      description: "Tùy chỉnh trước khi xuất, tạo Word/PDF và tải tệp",
    },
    {
      key: "history",
      label: "Lịch sử xử lý",
      description: "Theo dõi các lần lưu, tạo DOCX và xuất PDF",
    },
  ];

type BmPanelComponent = React.ComponentType<{
  documentId: string;
  onSaved?: () => void;
}>;

const Bm172FormInputsPanel: BmPanelComponent = () => <Bm172FormInputs />;

const BM_PANEL_BY_CODE: Record<string, BmPanelComponent> = {
  "BM-001": Bm001FormInputsPanel,
  "BM-002": Bm002FormInputsPanel,
  "BM-003": Bm003FormInputsPanel,
  "BM-005": Bm005FormInputsPanel,
  "BM-006": Bm006FormInputsPanel,
  "BM-007": Bm007FormInputsPanel,
  "BM-008": Bm008FormInputsPanel,
  "BM-009": Bm009FormInputsPanel,
  "BM-010": Bm010FormInputsPanel,
  "BM-011": Bm011FormInputsPanel,
  "BM-012": Bm012FormInputsPanel,
  "BM-014": Bm014FormInputsPanel,
  "BM-015": Bm015FormInputsPanel,
  "BM-016": Bm016FormInputsPanel,
  "BM-017": Bm017FormInputsPanel,
  "BM-018": Bm018FormInputsPanel,
  "BM-023": Bm023FormInputsPanel,
  "BM-030": Bm030FormInputsPanel,
  "BM-031": Bm031FormInputsPanel,
  "BM-033": Bm033FormInputsPanel,
  "BM-037": Bm037FormInputsPanel,
  "BM-038": Bm038FormInputsPanel,
  "BM-039": Bm039FormInputsPanel,
  "BM-040": Bm040FormInputsPanel,
  "BM-042": Bm042FormInputsPanel,
  "BM-043": Bm043FormInputsPanel,
  "BM-044": Bm044FormInputsPanel,
  "BM-045": Bm045FormInputsPanel,
  "BM-046": Bm046FormInputsPanel,
  "BM-047": Bm047FormInputsPanel,
  "BM-053": Bm053FormInputsPanel,
  "BM-054": Bm054FormInputsPanel,
  "BM-055": Bm055FormInputsPanel,
  "BM-056": Bm056FormInputsPanel,
  "BM-057": Bm057FormInputsPanel,
  "BM-058": Bm058FormInputsPanel,
  "BM-059": Bm059FormInputsPanel,
  "BM-070": Bm070FormInputsPanel,
  "BM-071": Bm071FormInputsPanel,
  "BM-072": Bm072FormInputsPanel,
  "BM-074": Bm074FormInputsPanel,
  "BM-076": Bm076FormInputsPanel,
  "BM-078": Bm078FormInputsPanel,
  "BM-081": Bm081FormInputsPanel,
  "BM-083": Bm083FormInputsPanel,
  "BM-084": Bm084FormInputsPanel,
  "BM-085": Bm085FormInputsPanel,
  "BM-086": Bm086FormInputsPanel,
  "BM-087": Bm087FormInputsPanel,
  "BM-088": Bm088FormInputsPanel,
  "BM-089": Bm089FormInputsPanel,
  "BM-090": Bm090FormInputsPanel,
  "BM-091": Bm091FormInputsPanel,
  "BM-092": Bm092FormInputsPanel,
  "BM-093": Bm093FormInputsPanel,
  "BM-094": Bm094FormInputsPanel,
  "BM-095": Bm095FormInputsPanel,
  "BM-096": Bm096FormInputsPanel,
  "BM-097": Bm097FormInputsPanel,
  "BM-098": Bm098FormInputsPanel,
  "BM-099": Bm099FormInputsPanel,
  "BM-100": Bm100FormInputsPanel,
  "BM-101": Bm101FormInputsPanel,
  "BM-102": Bm102FormInputsPanel,
  "BM-103": Bm103FormInputsPanel,
  "BM-104": Bm104FormInputsPanel,
  "BM-105": Bm105FormInputsPanel,
  "BM-106": Bm106FormInputsPanel,
  "BM-107": Bm107FormInputsPanel,
  "BM-108": Bm108FormInputsPanel,
  "BM-109": Bm109FormInputsPanel,
  "BM-110": Bm110FormInputsPanel,
  "BM-111": Bm111FormInputsPanel,
  "BM-112": Bm112FormInputsPanel,
  "BM-113": Bm113FormInputsPanel,
  "BM-114": Bm114FormInputsPanel,
  "BM-115": Bm115FormInputsPanel,
  "BM-116": Bm116FormInputsPanel,
  "BM-117": Bm117FormInputsPanel,
  "BM-118": Bm118FormInputsPanel,
  "BM-119": Bm119FormInputsPanel,
  "BM-120": Bm120FormInputsPanel,
  "BM-121": Bm121FormInputsPanel,
  "BM-122": Bm122FormInputsPanel,
  "BM-123": Bm123FormInputsPanel,
  "BM-124": Bm124FormInputsPanel,
  "BM-125": Bm125FormInputsPanel,
  "BM-126": Bm126FormInputsPanel,
  "BM-127": Bm127FormInputsPanel,
  "BM-128": Bm128FormInputsPanel,
  "BM-129": Bm129FormInputsPanel,
  "BM-130": Bm130FormInputsPanel,
  "BM-131": Bm131FormInputsPanel,
  "BM-132": Bm132FormInputsPanel,
  "BM-133": Bm133FormInputsPanel,
  "BM-134": Bm134FormInputsPanel,
  "BM-135": Bm135FormInputsPanel,
  "BM-136": Bm136FormInputsPanel,
  "BM-137": Bm137FormInputsPanel,
  "BM-138": Bm138FormInputsPanel,
  "BM-139": Bm139FormInputsPanel,
  "BM-140": Bm140FormInputsPanel,
  "BM-141": Bm141FormInputsPanel,
  "BM-142": Bm142FormInputsPanel,
  "BM-143": Bm143FormInputsPanel,
  "BM-144": Bm144FormInputsPanel,
  "BM-145": Bm145FormInputsPanel,
  "BM-146": Bm146FormInputsPanel,
  "BM-147": Bm147FormInputsPanel,
  "BM-148": Bm148FormInputsPanel,
  "BM-149": Bm149FormInputsPanel,
  "BM-150": Bm150FormInputsPanel,
  "BM-151": Bm151FormInputsPanel,
  "BM-152": Bm152FormInputsPanel,
  "BM-153": Bm153FormInputsPanel,
  "BM-154": Bm154FormInputsPanel,
  "BM-155": Bm155FormInputsPanel,
  "BM-156": Bm156FormInputsPanel,
  "BM-157": Bm157FormInputsPanel,
  "BM-158": Bm158FormInputsPanel,
  "BM-159": Bm159FormInputsPanel,
  "BM-160": Bm160FormInputsPanel,
  "BM-161": Bm161FormInputsPanel,
  "BM-166": Bm166FormInputsPanel,
  "BM-168": Bm168FormInputsPanel,
  "BM-169": Bm169FormInputsPanel,
  "BM-170": Bm170FormInputsPanel,
  "BM-171": Bm171FormInputsPanel,
  "BM-172": Bm172FormInputsPanel,
  "BM-173": Bm173FormInputsPanel,
  "BM-004": Bm004FormInputsPanel,
  "BM-013": Bm013FormInputsPanel,
  "BM-019": Bm019FormInputsPanel,
  "BM-020": Bm020FormInputsPanel,
  "BM-021": Bm021FormInputsPanel,
  "BM-022": Bm022FormInputsPanel,
  "BM-024": Bm024FormInputsPanel,
  "BM-025": Bm025FormInputsPanel,
  "BM-026": Bm026FormInputsPanel,
  "BM-027": Bm027FormInputsPanel,
  "BM-028": Bm028FormInputsPanel,
  "BM-029": Bm029FormInputsPanel,
  "BM-032": Bm032FormInputsPanel,
  "BM-034": Bm034FormInputsPanel,
  "BM-035": Bm035FormInputsPanel,
  "BM-036": Bm036FormInputsPanel,
  "BM-041": Bm041FormInputsPanel,
  "BM-048": Bm048FormInputsPanel,
  "BM-049": Bm049FormInputsPanel,
  "BM-050": Bm050FormInputsPanel,
  "BM-051": Bm051FormInputsPanel,
  "BM-052": Bm052FormInputsPanel,
  "BM-060": Bm060FormInputsPanel,
  "BM-061": Bm061FormInputsPanel,
  "BM-062": Bm062FormInputsPanel,
  "BM-063": Bm063FormInputsPanel,
  "BM-064": Bm064FormInputsPanel,
  "BM-065": Bm065FormInputsPanel,
  "BM-066": Bm066FormInputsPanel,
  "BM-067": Bm067FormInputsPanel,
  "BM-068": Bm068FormInputsPanel,
  "BM-069": Bm069FormInputsPanel,
  "BM-073": Bm073FormInputsPanel,
  "BM-075": Bm075FormInputsPanel,
  "BM-077": Bm077FormInputsPanel,
  "BM-079": Bm079FormInputsPanel,
  "BM-080": Bm080FormInputsPanel,
  "BM-082": Bm082FormInputsPanel,
  "BM-162": Bm162FormInputsPanel,
  "BM-163": Bm163FormInputsPanel,
  "BM-164": Bm164FormInputsPanel,
  "BM-165": Bm165FormInputsPanel,
  "BM-167": Bm167FormInputsPanel,
  "BM-174": Bm174FormInputsPanel,
  "BM-175": Bm175FormInputsPanel,
  "BM-176": Bm176FormInputsPanel,
  "BM-177": Bm177FormInputsPanel,
  "BM-178": Bm178FormInputsPanel,
  "BM-179": Bm179FormInputsPanel,
  "BM-180": Bm180FormInputsPanel,
  "BM-181": Bm181FormInputsPanel,
  "BM-182": Bm182FormInputsPanel,
  "BM-183": Bm183FormInputsPanel,
  "BM-184": Bm184FormInputsPanel,
  "BM-185": Bm185FormInputsPanel,
  "BM-186": Bm186FormInputsPanel,
  "BM-187": Bm187FormInputsPanel,
  "BM-188": Bm188FormInputsPanel,
  "BM-189": Bm189FormInputsPanel,
  "BM-190": Bm190FormInputsPanel,
  "BM-191": Bm191FormInputsPanel,
  "BM-192": Bm192FormInputsPanel,
  "BM-193": Bm193FormInputsPanel,
  "BM-194": Bm194FormInputsPanel,
  "BM-195": Bm195FormInputsPanel,
  "BM-196": Bm196FormInputsPanel,
  "BM-197": Bm197FormInputsPanel,
  "BM-198": Bm198FormInputsPanel,
  "BM-199": Bm199FormInputsPanel,
  "BM-200": Bm200FormInputsPanel,
  "BM-201": Bm201FormInputsPanel,
  "BM-202": Bm202FormInputsPanel,
  "BM-203": Bm203FormInputsPanel,
  "BM-204": Bm204FormInputsPanel,
  "BM-205": Bm205FormInputsPanel,
  "BM-206": Bm206FormInputsPanel,
  "BM-207": Bm207FormInputsPanel,
  "BM-208": Bm208FormInputsPanel,
  "BM-209": Bm209FormInputsPanel,
  "BM-210": Bm210FormInputsPanel,
  "BM-211": Bm211FormInputsPanel,
  "BM-212": Bm212FormInputsPanel,
  "BM-213": Bm213FormInputsPanel,
};

function getTemplateDescription(templateCode: string | null | undefined) {
  switch (templateCode) {
    case "BM-168":
      return "Form nhập dữ liệu riêng cho Biên bản giao nhận hồ sơ vụ án, vụ việc. Giao diện gom thành thời gian, địa điểm, bên giao, bên nhận, hồ sơ, vật chứng và chữ ký; các dòng dài được tự sinh.";
    case "BM-085":
      return "Form nhập dữ liệu riêng cho Quyết định chuyển vụ án hình sự để điều tra theo thẩm quyền. Dữ liệu được gom thành header, tên vụ án, tội danh, cơ quan đang điều tra, cơ quan nhận chuyển, Viện kiểm sát có thẩm quyền, nơi nhận và chữ ký.";
    case "BM-017":
      return "Form nhập dữ liệu riêng cho Yêu cầu khởi tố vụ án hình sự. Dữ liệu được gom thành header, cơ quan điều tra, vụ việc, tội danh, điều khoản BLHS, nơi nhận và chữ ký.";
    case "BM-007":
      return "Form nhập dữ liệu riêng cho Yêu cầu cung cấp tài liệu để kiểm sát việc giải quyết nguồn tin về tội phạm. Dữ liệu gồm cơ quan, số yêu cầu, lý do yêu cầu, danh mục tài liệu, thời hạn, nơi nhận và chữ ký.";    case "BM-009":
      return "Form nhập dữ liệu riêng cho Quyết định gia hạn thời hạn giải quyết nguồn tin về tội phạm. Dữ liệu gồm căn cứ tiếp nhận nguồn tin, đề nghị gia hạn, lý do gia hạn, nội dung Điều 1/Điều 2, nơi nhận và chữ ký.";
    case "BM-030":
      return "Form nhập dữ liệu riêng cho Thông báo kết quả giải quyết nguồn tin về tội phạm. Dữ liệu gồm kính gửi, nguồn tin, quyết định/kết quả giải quyết, nơi nhận và chữ ký.";    case "BM-170":
      return "Form nhập dữ liệu riêng cho Quyết định hủy bỏ Quyết định xử lý vật chứng. Dữ liệu gồm căn cứ khởi tố, quyết định xử lý vật chứng bị hủy, lý do hủy, Điều 1, Điều 2, nơi nhận và chữ ký.";    case "BM-047":
      return "Form nhập dữ liệu riêng cho Quyết định về việc bảo lĩnh. Dữ liệu gồm bị can, người nhận bảo lĩnh, căn cứ khởi tố, thời hạn bảo lĩnh, Điều 1, Điều 2, nơi nhận và chữ ký.";    case "BM-046":
      return "Form nhập dữ liệu riêng cho Quyết định không phê chuẩn Quyết định về việc bảo lĩnh. Dữ liệu gồm căn cứ khởi tố vụ án, khởi tố bị can, hồ sơ đề nghị bảo lĩnh, lý do không đủ căn cứ, Điều 1, Điều 2, nơi nhận và chữ ký.";    case "BM-159":
      return "Form nhập dữ liệu riêng cho Quyết định phân công Viện kiểm sát cấp dưới thực hành quyền công tố, kiểm sát xét xử sơ thẩm vụ án hình sự. Dữ liệu gồm cáo trạng, Viện kiểm sát được phân công, vụ án, tội danh, Điều 1, Điều 2, nơi nhận và chữ ký.";    case "BM-086":
      return "Form nhập dữ liệu riêng cho Quyết định chuyển việc thực hiện thẩm quyền thực hành quyền công tố, kiểm sát việc giải quyết vụ việc/vụ án hình sự. Dữ liệu gồm vụ án, VKS chuyển đi, VKS nhận, căn cứ thẩm quyền, Điều 1, Điều 2, nơi nhận và chữ ký.";
    case "BM-018":
      return "Form nhập dữ liệu riêng cho Yêu cầu ra Quyết định thay đổi Quyết định khởi tố vụ án hình sự. Dữ liệu gồm quyết định cũ, tội danh cũ, căn cứ thay đổi, tội danh mới, cơ quan được yêu cầu, nơi nhận và chữ ký.";    case "BM-016":
      return "Form nhập dữ liệu riêng cho Kết luận trực tiếp kiểm sát tiếp nhận, giải quyết nguồn tin về tội phạm. Dữ liệu gồm quyết định thực hiện, thống kê tiếp nhận/giải quyết, vi phạm, kiến nghị, nơi nhận và chữ ký.";    case "BM-015":
      return "Form nhập dữ liệu riêng cho Kế hoạch trực tiếp kiểm sát tiếp nhận, giải quyết nguồn tin về tội phạm. Dữ liệu gồm mục đích/yêu cầu, nội dung thống kê, đánh giá, thời gian/phương pháp, nơi nhận và chữ ký.";    case "BM-014":
      return "Form nhập dữ liệu riêng cho Quyết định trực tiếp kiểm sát tiếp nhận, giải quyết nguồn tin về tội phạm. Dữ liệu gồm thời gian trực tiếp kiểm sát, đoàn kiểm sát, yêu cầu chuẩn bị hồ sơ, nơi nhận và chữ ký.";    case "BM-011":
      return "Form nhập dữ liệu riêng cho Quyết định hủy bỏ Quyết định tạm đình chỉ việc giải quyết nguồn tin về tội phạm. Dữ liệu gồm quyết định tạm đình chỉ bị hủy, xét thấy, Điều 1, Điều 2, nơi nhận và chữ ký.";    case "BM-012":
      return "Form nhập dữ liệu riêng cho Quyết định phục hồi giải quyết nguồn tin về tội phạm. Dữ liệu gồm cơ quan, số quyết định, lý do phục hồi, quyết định tạm đình chỉ, vụ việc, nơi nhận và chữ ký.";
    case "BM-010":
      return "Form nhập dữ liệu riêng cho Quyết định tạm đình chỉ giải quyết nguồn tin về tội phạm. Dữ liệu gồm cơ quan, số quyết định, lý do tạm đình chỉ, vụ việc, ngày tiếp nhận, Điều 2, Điều 3, nơi nhận và chữ ký.";
    case "BM-008":
      return "Form nhập dữ liệu riêng cho Yêu cầu chuyển nguồn tin về tội phạm. Dữ liệu gồm cơ quan, số yêu cầu, lý do chuyển, cơ quan chuyển, cơ quan tiếp nhận, nơi nhận và chữ ký.";
    case "BM-006":
      return "Form nhập dữ liệu riêng cho Yêu cầu tiếp nhận, kiểm tra, xác minh, ra quyết định giải quyết nguồn tin về tội phạm. Dữ liệu gồm cơ quan, số yêu cầu, lý do xét thấy, cơ quan/người được yêu cầu, nội dung yêu cầu, nơi nhận và chữ ký.";
    case "BM-003":
      return "Form nhập dữ liệu riêng cho Quyết định phân công thực hành quyền công tố, kiểm sát việc tiếp nhận, giải quyết nguồn tin về tội phạm. Dữ liệu gồm cơ quan, số quyết định, Kiểm sát viên được phân công, Kiểm tra viên giúp việc nếu có, Điều 1/2/3, nơi nhận và chữ ký.";
    case "BM-005":
      return "Form nhập dữ liệu riêng cho Yêu cầu kiểm tra, xác minh nguồn tin về tội phạm. Dữ liệu gồm lần yêu cầu, căn cứ tố tụng, nhận định cần xác minh, cơ quan được yêu cầu, các vấn đề a/b/c/d, nơi nhận và Kiểm sát viên ký.";
    case "BM-001":
      return "Form nhập dữ liệu riêng cho Biên bản tiếp nhận nguồn tin về tội phạm. Dữ liệu gồm cơ quan lập biên bản, thời gian tiếp nhận, người tiếp nhận, người cung cấp nguồn tin, nội dung nguồn tin, tài liệu giao nộp và chữ ký.";
    case "BM-023":
      return "Form nhập dữ liệu riêng cho Quyết định khởi tố vụ án hình sự. Dữ liệu gồm số quyết định, căn cứ pháp lý, nội dung vụ việc, tội danh, yêu cầu điều tra, nơi nhận và chữ ký.";
    case "BM-031":
      return "Form nhập dữ liệu riêng cho Quyết định phê chuẩn Lệnh bắt người bị giữ trong trường hợp khẩn cấp. Dữ liệu gồm số quyết định, căn cứ phê chuẩn, nội dung Điều 1/2, nơi nhận và chữ ký.";
    case "BM-033":
      return "Form nhập dữ liệu riêng cho Quyết định phê chuẩn Quyết định gia hạn tạm giữ. Dữ liệu gồm căn cứ quyết định tạm giữ, quyết định gia hạn tạm giữ, hồ sơ đề nghị phê chuẩn, lý do phê chuẩn, Điều 1/2, nơi nhận và chữ ký.";    case "BM-037":
      return "Form nhập dữ liệu riêng cho Quyết định phê chuẩn Lệnh bắt bị can để tạm giam. Dữ liệu gồm căn cứ khởi tố vụ án/bị can, đề nghị phê chuẩn, nội dung Điều 1/2, thời hạn tạm giam, nơi nhận và chữ ký.";
    case "BM-038":
      return "Form nhập dữ liệu riêng cho Quyết định không phê chuẩn Lệnh bắt bị can để tạm giam. Dữ liệu gồm tên bị can, tên tội, điều luật, căn cứ khởi tố, hồ sơ đề nghị phê chuẩn, lý do không phê chuẩn, Điều 1/2, nơi nhận và chữ ký.";    case "BM-039":
      return "Form nhập dữ liệu riêng cho Lệnh bắt bị can để tạm giam. Dữ liệu gồm tên bị can, lý lịch, tội danh, căn cứ khởi tố, thời hạn tạm giam, cơ quan thi hành, cơ sở giam giữ, nơi nhận và chữ ký.";    case "BM-045":
      return "Form nhập dữ liệu riêng cho Quyết định phê chuẩn Quyết định về việc bảo lĩnh. Có checkbox dòng người chưa thành niên và tự đồng bộ tên bị can, tội danh, quyết định bảo lĩnh, nơi nhận, chữ ký.";    case "BM-044":
      return "Form nhập dữ liệu riêng cho Quyết định thay thế biện pháp tạm giam. Có checkbox dòng người chưa thành niên và checkbox dòng căn cứ gia hạn tạm giam nếu có.";    case "BM-040":
      return "Form nhập dữ liệu riêng cho Quyết định phê chuẩn Lệnh tạm giam. Dữ liệu gồm căn cứ tố tụng, căn cứ khởi tố vụ án/bị can, đề nghị phê chuẩn Lệnh tạm giam, nội dung Điều 1/2, thời hạn tạm giam, nơi nhận và chữ ký.";
    case "BM-042":
      return "Form nhập dữ liệu riêng cho Quyết định gia hạn tạm giam. Dữ liệu gồm lần gia hạn, căn cứ lệnh tạm giam, căn cứ gia hạn trước đó nếu có, hồ sơ đề nghị gia hạn, Điều 1/2/3, nơi nhận và chữ ký.";
    case "BM-043":
      return "Form nhập dữ liệu riêng cho Quyết định hủy bỏ biện pháp tạm giam. Dữ liệu gồm căn cứ lệnh tạm giam, căn cứ quyết định gia hạn/truy tố nếu có, lý do hủy bỏ, Điều 1/2/3, nơi nhận và chữ ký.";
    case "BM-053":
      return "Form nhập dữ liệu riêng cho Lệnh cấm đi khỏi nơi cư trú. Dữ liệu được lưu trước, sau đó mới tạo DOCX/PDF để đảm bảo biểu mẫu xuất ra đúng nghiệp vụ.";
    case "BM-055":
      return "Form nhập dữ liệu riêng cho Quyết định hủy bỏ biện pháp cấm đi khỏi nơi cư trú. Dữ liệu gồm số quyết định, căn cứ lệnh cấm, lý do hủy bỏ, thông tin bị can, nơi nhận và chữ ký.";
    case "BM-056":
      return "Form nhập dữ liệu riêng cho Quyết định tạm hoãn xuất cảnh. Dữ liệu gồm số quyết định, thông tin người bị tạm hoãn xuất cảnh, thời hạn tạm hoãn, cơ quan quản lý xuất nhập cảnh, nơi nhận và chữ ký.";
    case "BM-057":
      return "Form nhập dữ liệu riêng cho Quyết định hủy bỏ biện pháp tạm hoãn xuất cảnh. Dữ liệu gồm số quyết định, căn cứ quyết định tạm hoãn xuất cảnh, lý do hủy bỏ, thông tin người liên quan, nơi nhận và chữ ký.";
    case "BM-058":
      return "Form nhập dữ liệu riêng cho Lệnh tạm giam. Dữ liệu gồm số lệnh, căn cứ khởi tố vụ án/bị can, thời hạn tạm giam, đơn vị thi hành, thông tin bị can, nơi nhận, giao nhận lệnh và chữ ký.";
    case "BM-059":
      return "Form nhập dữ liệu riêng cho Quyết định gia hạn thời hạn tạm giam để truy tố. Dữ liệu gồm số quyết định, căn cứ lệnh tạm giam, căn cứ gia hạn truy tố, thời hạn gia hạn, cơ sở giam giữ, thông tin bị can, nơi nhận, giao nhận quyết định và chữ ký.";
    case "BM-070":
      return "Form nhập dữ liệu riêng cho Quyết định phân công Phó Viện trưởng thực hành quyền công tố, kiểm sát việc giải quyết vụ án hình sự. Dữ liệu gồm người được phân công, căn cứ khởi tố vụ án, căn cứ pháp lý, nơi nhận và chữ ký.";
    case "BM-103":
      return "Form nhập dữ liệu riêng cho Đề nghị gia hạn thời hạn điều tra vụ án hình sự.";
    case "BM-104":
      return "Form nhập dữ liệu riêng cho Quyết định gia hạn thời hạn điều tra vụ án hình sự.";
    case "BM-141":
      return "Form nhập dữ liệu riêng cho BM-001 - Biên bản tiếp nhận nguồn tin về tội phạm. Dữ liệu gồm thời gian tiếp nhận, địa điểm tiếp nhận, người tiếp nhận, người cung cấp nguồn tin, nội dung nguồn tin và chữ ký.";
    case "BM-144":
      return "Form nhập dữ liệu riêng cho Quyết định gia hạn thời hạn quyết định việc truy tố. Dữ liệu gồm căn cứ khởi tố, kết luận điều tra, lý do gia hạn, thời hạn gia hạn, nơi nhận và chữ ký.";
    case "BM-145":
      return "Form nhập dữ liệu riêng cho Quyết định trả hồ sơ vụ án để điều tra bổ sung. Dữ liệu gồm căn cứ pháp lý, bản kết luận điều tra, quyết định trả hồ sơ của Tòa án nếu có, lý do điều tra bổ sung, nội dung Điều 1/2/3, nơi nhận và chữ ký.";
    case "BM-070":
      return "Form nhập dữ liệu riêng cho Quyết định phân công Phó Viện trưởng thực hành quyền công tố, kiểm sát việc giải quyết vụ án hình sự. Dữ liệu gồm người được phân công, căn cứ khởi tố vụ án, căn cứ pháp lý, nơi nhận và chữ ký.";
    case "BM-072":
      return "Form nhập dữ liệu riêng cho Quyết định thay đổi người thực hành quyền công tố, kiểm sát việc giải quyết vụ án hình sự. Dữ liệu gồm thông tin vụ án, người cũ, người mới, lý do thay đổi, nơi nhận và chữ ký.";
    case "BM-074":
      return "Form nhập dữ liệu riêng cho Yêu cầu cử người phiên dịch, người dịch thuật. Dữ liệu gồm thông tin vụ án, lý do, thông tin người phiên dịch, cơ quan được yêu cầu, nơi nhận và chữ ký.";
    case "BM-076":
      return "Form nhập dữ liệu riêng cho Quyết định thay đổi người phiên dịch, người dịch thuật. Dữ liệu gồm thông tin vụ án, người phiên dịch cũ, người mới, lý do thay đổi, nơi nhận và chữ ký.";
    case "BM-078":
      return "Form nhập dữ liệu riêng cho Thông báo người bào chữa. Dữ liệu gồm thông tin người bào chữa, bị can và nội dung thông báo.";
    case "BM-081":
      return "Form nhập dữ liệu riêng cho Quyết định thời điểm người bào chữa tham gia tố tụng. Dữ liệu gồm thông tin vụ án, người bào chữa và thời điểm bắt đầu tham gia, nơi nhận và chữ ký.";
    case "BM-083":
      return "Form nhập dữ liệu riêng cho Yêu cầu thay đổi người giám định, người định giá tài sản. Dữ liệu gồm thông tin vụ án, bị can, người giám định/định giá và lý do thay đổi, nơi nhận và chữ ký.";
    case "BM-084":
      return "Form nhập dữ liệu riêng cho Quyết định thay đổi người giám định, người định giá tài sản. Dữ liệu gồm thông tin vụ án, người giám định cũ, người mới, lý do thay đổi, nơi nhận và chữ ký.";
    case "BM-097":
      return "Form nhập dữ liệu riêng cho Quyết định khởi tố bị can. Dữ liệu gồm thông tin bị can, căn cứ khởi tố vụ án, tội danh, hành vi, cơ quan điều tra, nơi nhận và chữ ký.";
    case "BM-090":
      return "Form nhập dữ liệu riêng cho Quyết định phê chuẩn Quyết định khởi tố bị can.";
    case "BM-148":
      return "Form nhập dữ liệu riêng cho Quyết định tạm đình chỉ vụ án hình sự đối với bị can. Dữ liệu gồm căn cứ tố tụng, quyết định khởi tố vụ án/bị can, tên bị can, tội danh, nội dung tạm đình chỉ, nơi nhận và chữ ký.";
    case "BM-146":
      return "Form nhập dữ liệu riêng cho Quyết định tạm đình chỉ vụ án hình sự. Dữ liệu gồm căn cứ tố tụng, căn cứ khởi tố vụ án, lý do tạm đình chỉ, nội dung Điều 1-4, nơi nhận và chữ ký.";
    case "BM-087":
      return "Form nhập dữ liệu riêng cho Yêu cầu điều tra. Dữ liệu gồm cơ quan được yêu cầu, tên vụ án, tội danh, nội dung yêu cầu tự sinh, nơi nhận và chữ ký.";
    case "BM-091":
      return "Form nhập dữ liệu riêng cho QĐ phê chuẩn QĐ thay đổi QĐ khởi tố bị can. Dữ liệu gồm quyết định cũ, lý do thay đổi, thông tin bị can, tội danh, nội dung tự sinh, nơi nhận và chữ ký.";
    case "BM-092":
      return "Form nhập dữ liệu riêng cho QĐ phê chuẩn QĐ bổ sung QĐ khởi tố bị can. Dữ liệu gồm quyết định cũ, lý do bổ sung, thông tin bị can, tội danh, nội dung tự sinh, nơi nhận và chữ ký.";
    case "BM-099":
      return "Form nhập dữ liệu riêng cho QĐ thay đổi QĐ khởi tố bị can. Dữ liệu gồm quyết định cũ, lý do thay đổi, thông tin bị can, tội danh, nội dung tự sinh, nơi nhận và chữ ký.";
    case "BM-101":
      return "Form nhập dữ liệu riêng cho QĐ bổ sung QĐ khởi tố bị can. Dữ liệu gồm quyết định cũ, lý do bổ sung, thông tin bị can, tội danh, nội dung tự sinh, nơi nhận và chữ ký.";
    case "BM-102":
      return "Form nhập dữ liệu riêng cho QĐ hủy bỏ QĐ khởi tố bị can. Dữ liệu gồm quyết định bị hủy, lý do hủy, thông tin bị can, tội danh, nội dung tự sinh, nơi nhận và chữ ký.";
    case "BM-104":
      return "Form nhập dữ liệu riêng cho QĐ gia hạn thời hạn điều tra vụ án hình sự. Dữ liệu gồm lần gia hạn, quyết định gia hạn trước, tên vụ án, tội danh, lý do gia hạn, thời hạn mới tự sinh, nơi nhận và chữ ký.";
    case "BM-107":
      return "Form nhập dữ liệu riêng cho QĐ hủy bỏ QĐ tạm đình chỉ điều tra VAHS. Dữ liệu gồm quyết định tạm đình chỉ bị hủy, tên vụ án, tội danh, lý do hủy, nội dung tự sinh, nơi nhận và chữ ký.";
    case "BM-116":
      return "Form nhập dữ liệu riêng cho QĐ phục hồi điều tra vụ án hình sự. Dữ liệu gồm quyết định tạm đình chỉ, tên vụ án, tội danh, lý do phục hồi, nội dung tự sinh, nơi nhận và chữ ký.";
    case "BM-119":
      return "Form nhập dữ liệu riêng cho QĐ phê chuẩn Lệnh khám xét. Dữ liệu gồm lý do khám xét, địa điểm khám xét, nội dung khám xét tự sinh, nơi nhận và chữ ký.";
    case "BM-120":
      return "Form nhập dữ liệu riêng cho QĐ không phê chuẩn Lệnh khám xét. Dữ liệu gồm căn cứ tố tụng, lý do không phê chuẩn tự sinh, nơi nhận và chữ ký.";
    case "BM-126":
      return "Form nhập dữ liệu riêng cho QĐ trưng cầu giám định. Dữ liệu gồm tên người giám định, mô tả tang vật, yêu cầu giám định tự sinh, nơi nhận và chữ ký.";
    case "BM-134":
      return "Form nhập dữ liệu riêng cho BB ghi lời khai. Dữ liệu gồm thông tin người làm chứng, căn cứ điều tra tự sinh, nơi nhận và chữ ký.";
    case "BM-135":
      return "Form nhập dữ liệu riêng cho BB hỏi cung bị can. Dữ liệu gồm thông tin bị can, câu hỏi và trả lời (động), nơi nhận và chữ ký.";
    case "BM-123":
      return "Form nhập dữ liệu riêng cho QĐ thực nghiệm điều tra. Dữ liệu gồm quyết định điều tra, mục đích, thời gian, địa điểm, phương pháp thực nghiệm, kết quả dự kiến và chữ ký.";
    case "BM-124":
      return "Form nhập dữ liệu riêng cho BB thực nghiệm điều tra. Dữ liệu gồm quyết định thực nghiệm, thời gian, địa điểm, danh sách người tham dự, nội dung thực nghiệm, ghi chú quan sát, kết luận và chữ ký.";
    case "BM-136":
      return "Form nhập dữ liệu riêng cho BB đối chất. Dữ liệu gồm thông tin vụ án, hai người tham gia, lời khai từng người, mâu thuẫn ghi nhận, kết luận và chữ ký.";
    case "BM-137":
      return "Form nhập dữ liệu riêng cho BB xác minh - làm việc. Dữ liệu gồm thông tin vụ án, nội dung cần xác minh, phương pháp, kết quả xác minh, kết luận và người lập biên bản.";
    case "BM-139":
      return "Form nhập dữ liệu riêng cho Kiến nghị khắc phục, xử lý vi phạm trong hoạt động khởi tố, điều tra. Dữ liệu gồm vụ án, mô tả vi phạm, căn cứ pháp lý, biện pháp kiến nghị, thời hạn và chữ ký.";
    case "BM-140":
      return "Form nhập dữ liệu riêng cho Kiến nghị áp dụng biện pháp phòng ngừa tội phạm và vi phạm pháp luật. Dữ liệu gồm thông tin vụ án, đối tượng, biện pháp đề nghị, căn cứ pháp lý và chữ ký.";
    default:
      return "Khu vực xử lý dữ liệu biểu mẫu, tạo DOCX/PDF và quản lý tệp đã xuất.";
  }
}
export function GeneratedDocumentWorkspace({
  documentId,
}: GeneratedDocumentWorkspaceProps) {
  const [activeTab, setActiveTab] = useState<TabKey>("form");
  const [refreshKey, setRefreshKey] = useState(0);
  const [payload, setPayload] = useState<RenderPayloadResponse | null>(null);
  const [isLoadingPayload, setIsLoadingPayload] = useState(true);
  const [payloadError, setPayloadError] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;

    async function loadPayload() {
      try {
        setIsLoadingPayload(true);
        setPayloadError(null);

        const response = await fetch(
          absoluteApiUrl(`/documents/generated/${documentId}/render-payload`),
          {
            method: "GET",
            credentials: "include",
            headers: {
              Accept: "application/json",
            },
            cache: "no-store",
          },
        );

        if (!response.ok) {
          const text = await response.text();
          throw new Error(
            text || `Không tải được payload biểu mẫu. HTTP ${response.status}`,
          );
        }

        const data = (await response.json()) as RenderPayloadResponse;

        if (isMounted) {
          setPayload(data);
        }
      } catch (error) {
        if (isMounted) {
          setPayloadError(
            error instanceof Error
              ? error.message
              : "Không tải được payload biểu mẫu.",
          );
        }
      } finally {
        if (isMounted) {
          setIsLoadingPayload(false);
        }
      }
    }

    void loadPayload();

    return () => {
      isMounted = false;
    };
  }, [documentId, refreshKey]);

  const templateCode = payload?.template?.templateCode ?? "UNKNOWN";
  const templateNo = payload?.template?.templateNo?.trim() ?? "";
  const templateName = payload?.template?.templateName ?? "Chưa xác định";
  const documentCode = payload?.document?.documentCode?.trim() ?? "";
  const caseCode = payload?.case?.caseCode?.trim() ?? "";
  const caseTitle = payload?.case?.caseTitle?.trim() ?? "";
  const personName = payload?.person?.fullName?.trim() ?? "";

  const canonicalPageTitle = templateNo
    ? `Mẫu số ${templateNo} - ${templateName}`
    : `${templateCode} - ${templateName}`.trim();

  const headerContextItems = [
    caseCode ? `Hồ sơ: ${caseCode}` : "",
    caseTitle ? `Tên vụ án: ${caseTitle}` : "",
    personName ? `Người liên quan: ${personName}` : "Cấp hồ sơ",
    documentCode ? `Số văn bản: ${documentCode}` : "",
  ].filter((value) => value.length > 0);

  const headerDescription = useMemo(
    () => getTemplateDescription(templateCode),
    [templateCode],
  );
  const isInitialPayloadLoading = isLoadingPayload && !payload;

  const casePayload = useMemo(
    () => buildCasePayloadFromRenderPayload(payload),
    [payload],
  );

  const Panel = templateCode
    ? BM_PANEL_BY_CODE[templateCode] ?? GenericTemplateFormInputsPanel
    : GenericTemplateFormInputsPanel;

  return (
    <CasePayloadProvider value={casePayload}>
    <main className="qvks-document-workspace min-h-screen bg-slate-50 px-5 py-7 md:px-10">
      <div className="mx-auto w-full max-w-[1500px] space-y-7">
    <header className="rounded-3xl border border-slate-200 bg-white p-7 shadow-sm">
      <p className="text-sm font-semibold uppercase tracking-[0.24em] text-slate-500">
        QUANLYVKS / Biểu mẫu đã tạo
      </p>

      <div className="mt-4 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2.5">
            <span className="rounded-full bg-slate-950 px-3.5 py-1.5 text-sm font-bold text-white">
              {templateCode}
            </span>

            <span className="rounded-full border border-slate-200 bg-slate-50 px-3.5 py-1.5 text-sm font-semibold text-slate-600">
              {payload?.template?.renderScope ?? "UNKNOWN_SCOPE"}
            </span>
          </div>

          <h1 className="mt-4 text-3xl font-bold tracking-tight text-slate-950 md:text-4xl">
            {isInitialPayloadLoading ? "Đang tải biểu mẫu..." : canonicalPageTitle}
          </h1>

          {!isInitialPayloadLoading && headerContextItems.length > 0 ? (
            <div className="mt-4 flex flex-wrap gap-2.5">
              {headerContextItems.map((item) => (
                <span
                  key={item}
                  className="rounded-full border border-slate-200 bg-slate-50 px-3.5 py-1.5 text-sm font-semibold text-slate-600"
                >
                  {item}
                </span>
              ))}
            </div>
          ) : null}

          <p className="mt-4 max-w-5xl text-base leading-7 text-slate-600">
            {headerDescription}
          </p>

          {payloadError ? (
            <p className="mt-4 rounded-2xl border border-red-200 bg-red-50 px-5 py-4 text-base leading-7 text-red-700">
              {payloadError}
            </p>
          ) : null}
        </div>

        <div className="min-w-[140px] rounded-2xl border border-slate-200 bg-slate-50 px-5 py-4 text-base">
          <span className="text-slate-500">Mã biểu mẫu</span>

          <div className="mt-1 font-mono text-lg font-bold text-slate-950">
            #{documentId}
          </div>
        </div>
      </div>
    </header>
        <section className="rounded-3xl border border-slate-200 bg-white p-2 shadow-sm">
          <div className="grid gap-2 md:grid-cols-3">
            {TABS.map((tab) => {
              const isActive = activeTab === tab.key;

              return (
                <button
                  key={tab.key}
                  type="button"
                  onClick={() => setActiveTab(tab.key)}
                  className={
                    isActive
                      ? "rounded-2xl bg-slate-950 px-4 py-3 text-left text-white shadow-sm"
                      : "rounded-2xl px-4 py-3 text-left text-slate-700 transition hover:bg-slate-50"
                  }
                >
                  <span className="block text-sm font-bold">{tab.label}</span>
                  <span
                    className={
                      isActive
                        ? "mt-1 block text-xs text-slate-300"
                        : "mt-1 block text-xs text-slate-500"
                    }
                  >
                    {tab.description}
                  </span>
                </button>
              );
            })}
          </div>
        </section>

        {activeTab === "form" ? (
          <>
            {isInitialPayloadLoading ? (
              <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
                <p className="text-sm text-slate-600">
                  Đang tải dữ liệu biểu mẫu...
                </p>
              </section>
            ) : null}

            {!isInitialPayloadLoading && Panel ? (
              <Panel
                documentId={documentId}
                onSaved={() => setRefreshKey((current) => current + 1)}
              />
            ) : null}

          </>
        ) : null}

        {activeTab === "files" ? (
          <GeneratedDocumentActionPanel
            key={`document-files-${refreshKey}`}
            documentId={documentId}
          />
        ) : null}

        {activeTab === "history" ? (
          <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <h2 className="text-lg font-bold text-slate-950">
              Lịch sử xử lý
            </h2>
            <p className="mt-2 text-sm leading-6 text-slate-600">
              Tab này để giai đoạn sau nối dữ liệu từ nhật ký xử lý / lần tạo biểu mẫu
              batch. Hiện tại luồng chính cần kiểm tra là: nhập dữ liệu → lưu
              dữ liệu biểu mẫu → tạo DOCX → xuất PDF → tải tệp.
            </p>
          </section>
        ) : null}
      </div>
    </main>
    </CasePayloadProvider>
  );
}
