package com.dba.alld.controller;

import com.itextpdf.io.font.PdfEncodings;
import com.itextpdf.kernel.font.PdfFont;
import com.itextpdf.kernel.font.PdfFontFactory;
import com.itextpdf.kernel.pdf.PdfDocument;
import com.itextpdf.kernel.pdf.PdfWriter;
import com.itextpdf.layout.Document;
import com.itextpdf.layout.element.Paragraph;

import java.io.File;

public class HindiPdfExample {
    public static void main(String[] args) throws Exception {
        String dest = "output/hindi_output.pdf";
        File file = new File(dest);
        file.getParentFile().mkdirs();

        PdfWriter writer = new PdfWriter(dest);
        PdfDocument pdf = new PdfDocument(writer);
        Document document = new Document(pdf);

        // ✅ Correct iText 7 usage — use the overload that takes a Path or InputStream
        String fontPath = "src/main/resources/fonts/NotoSansDevanagari-Regular.ttf";
        PdfFont font = PdfFontFactory.createFont(fontPath, PdfEncodings.IDENTITY_H);

        String hindiText = "मैं एक वकील हूँ और यह मेरा वकालतनामा है।";
        document.add(new Paragraph(hindiText).setFont(font).setFontSize(14));

        document.close();
        System.out.println("✅ PDF created successfully: " + dest);
    }
}

