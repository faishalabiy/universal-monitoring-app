import { NextResponse } from "next/server";

export function unauthorizedResponse() {
  return NextResponse.json(
    { message: "Anda harus login terlebih dahulu." },
    { status: 401 }
  );
}

export function forbiddenResponse() {
  return NextResponse.json(
    { message: "Anda tidak memiliki akses untuk aksi ini." },
    { status: 403 }
  );
}

export function serverErrorResponse() {
  return NextResponse.json(
    { message: "Terjadi kesalahan pada server." },
    { status: 500 }
  );
}

export function badRequestResponse(message: string) {
  return NextResponse.json({ message }, { status: 400 });
}

export function notFoundResponse(message = "Data tidak ditemukan.") {
  return NextResponse.json({ message }, { status: 404 });
}