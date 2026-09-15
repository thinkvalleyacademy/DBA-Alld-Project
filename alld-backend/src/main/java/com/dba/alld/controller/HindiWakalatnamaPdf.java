package com.dba.alld.controller;



/**
 * Generates Wakalatnama-style PDF (Hindi)
 * Requires iText7 7.2.6+  and Java 21+
 */


import com.itextpdf.io.font.PdfEncodings;
import com.itextpdf.io.image.ImageDataFactory;
import com.itextpdf.kernel.colors.ColorConstants;
import com.itextpdf.kernel.font.PdfFont;
import com.itextpdf.kernel.font.PdfFontFactory;
import com.itextpdf.kernel.geom.PageSize;
import com.itextpdf.kernel.pdf.PdfDocument;
import com.itextpdf.kernel.pdf.PdfWriter;
import com.itextpdf.kernel.pdf.canvas.draw.ILineDrawer;
import com.itextpdf.layout.Document;
import com.itextpdf.layout.borders.Border;
import com.itextpdf.layout.borders.DashedBorder;
import com.itextpdf.layout.borders.SolidBorder;
import com.itextpdf.layout.element.*;
import com.itextpdf.layout.properties.TextAlignment;
import com.itextpdf.layout.properties.UnitValue;
import com.itextpdf.layout.properties.VerticalAlignment;

import java.io.File;

public class HindiWakalatnamaPdf {

    public static void main(String[] args) throws Exception {

        // ---------- OUTPUT FILE ----------
        String dest = "output/wakalatnama_output.pdf";
        File file = new File(dest);
        if (file.getParentFile() != null) {
            file.getParentFile().mkdirs();
        }

        // ---------- PDF SETUP ----------
        PdfWriter writer = new PdfWriter(dest);
        PdfDocument pdf = new PdfDocument(writer);
        Document doc = new Document(pdf, PageSize.A4);
        doc.setMargins(36, 36, 36, 36); // 1/2 inch margins

        // ---------- FONT SETUP ----------
        String fontPath = "src/main/resources/fonts/NotoSansDevanagari-Regular.ttf";
        PdfFont hindiFont = PdfFontFactory.createFont(fontPath, PdfEncodings.IDENTITY_H);


        // ---------- HEADER SECTION ----------
        Table header = new Table(UnitValue.createPercentArray(new float[]{1, 1, 1, 1}))
                .useAllAvailableWidth();

        header.addCell(makeCell("हस्ताक्षर\nमंत्री/कोषाध्यक्ष", hindiFont, TextAlignment.LEFT, 12, false));
        header.addCell(makeCell(
                "अधिवक्ता का नाम: उमेश चंद्र मिश्रा\nबैठने का स्थान: मुख्तार खाना सीट नं. 1",
                hindiFont, TextAlignment.LEFT, 12, false));

        Image logo = new Image(ImageDataFactory.create("assets/img/wakalatalogo.jpg"))
                .scaleToFit(100, 100);
        Cell logoCell = new Cell().add(logo)
                .setBorder(Border.NO_BORDER)
                .setTextAlignment(TextAlignment.CENTER);
        header.addCell(logoCell);

        header.addCell(makeCell(
                "पंजीयन सं० - 0028296\nमो० नं० - 9956694102",
                hindiFont, TextAlignment.RIGHT, 12, false));

        doc.add(header);

        // dashed line
        doc.add(new LineSeparator((ILineDrawer) new DashedBorder(ColorConstants.BLACK, 1)));

        // ---------- FEE BOXES ----------
        Table feeTable = new Table(UnitValue.createPercentArray(new float[]{1, 1, 2}))
                .useAllAvailableWidth()
                .setMarginTop(10f);

        feeTable.addCell(makeBox("रु 10 /- अधिवक्ता कल्याणकारी टिकट", hindiFont));
        feeTable.addCell(makeBox("रु 2 /- कोर्ट फीस टिकट", hindiFont));
        feeTable.addCell(makeCell("""
                सीरियल नं०- 0028296
                दिनांक - 03 Oct, 2025
                समय - 09:22 PM
                जारीकर्ता - Tech Support
                """, hindiFont, TextAlignment.LEFT, 12, false));

        doc.add(feeTable);

        // wakalatnamalogo full-width
        Image bigLogo = new Image(ImageDataFactory.create("assets/img/wakalatnamalogo.jpg"))
                .setAutoScale(true)
                .setMarginTop(10f);
        doc.add(bigLogo);

        // ---------- MAIN BODY ----------
        doc.add(new Paragraph("न्यायालय").setFont(hindiFont));
        doc.add(new Paragraph("प्रयागराज").setFont(hindiFont));
        doc.add(new Paragraph("नम्बर").setFont(hindiFont));
        doc.add(new Paragraph("मुकदमा").setFont(hindiFont));
        doc.add(new Paragraph("सन्").setFont(hindiFont));
        doc.add(new Paragraph("नम्बर").setFont(hindiFont));
        doc.add(new Paragraph("इजरा").setFont(hindiFont));

        doc.add(new Paragraph("परिवादी/मुददई/अपीलान्ट").setFont(hindiFont).setBold());
        doc.add(new Paragraph("बनाम्").setFont(hindiFont));
        doc.add(new Paragraph("अभियुक्त/मुददालैह/रेस्पान्डेन्ट").setFont(hindiFont).setBold());

        // dashed line divider
        //doc.add(new LineSeparator(new DashedLine()));

        // ---------- ADVOCATE INFO ----------
        doc.add(new Paragraph("मैं / हम").setFont(hindiFont));
        doc.add(new Paragraph("निवासी / निवासीगण -").setFont(hindiFont));
        doc.add(new Paragraph(
                "श्री उमेश चंद्र मिश्रा, Enroll No - UP4281/83, POR No - POR00001248, Mob. No - 9956694102")
                .setFont(hindiFont).setBold());
        doc.add(new Paragraph("चैम्बर / सीट - मुख्तार खाना सीट नं. 1").setFont(hindiFont).setBold());

        // ---------- MAIN DECLARATION TEXT ----------
        String mainText = """
                को उपरोक्त मुकदमे की पैरवी के लिये मेहनताना अदा करने का वचन देकर मैं / हम अपना वकील नियुक्त करता हूँ / करते हैं |
                उक्त वकील महोदय को मैं / हम यह अधिकार देता हूँ / देते हैं कि वह मुकदमे में मेरी ओर से पैरवी करें,
                आवश्यकतानुसार सवाल पूछें, जवाब दें और बहस करें, सुलहनामा दाखिल करें, दावा स्वीकार करें, उठा लेवें और
                डिग्री प्राप्त कर जाये तो उसे जारी करावें, डिग्री का रुपया व खर्चा, हर्जाना का रुपया या किसी दूसरे तरह का रुपया व खर्चा
                जो अदालत से मुझे / हमें मिलने वाला हो वसूल करें, मेरी / हमारी ओर से अदालत में दाखिल करें,
                कोर्ट फीस व स्टाम्प देवें या वापिस लेवे, रसीद ले लेवे व प्रमाणित करें, नकल प्राप्त करें, अदालत के अनुमति से मिसिल का मुआयना करें,
                आवश्यकता होने पर मुकदमा स्थापित करावे व इसे मुकदमे के सम्बन्ध में दूसरे काम जो जरुरी समझें पैरवी के लिए
                अपनी ओर से कोई दूसरा वकील नियुक्त करें। यदि आवश्यकता हो तो अपील या निगरानी दायर करें और अपील निगरानी की
                अदालत में पैरवी करें और यह भी वचन देता हूँ / देते हैं कि यदि मैं / हम पूरी फीस या खर्च न अदा करुँ / करें,
                तो वकील महोदय इस मुकदमे के सम्बन्ध में जो कुछ काम करेंगे वह सब अदालत में स्वयं मेरा / हमारा किया हुआ समझा जायेगा
                और वह सदैव ही मेरे / हमारे किये के समान सर्वथा मान्य होगा।
                """;
        Paragraph declaration = new Paragraph(mainText)
                .setFont(hindiFont)
                .setTextAlignment(TextAlignment.JUSTIFIED)
                .setFontSize(12)
                .setMarginTop(10f);
        doc.add(declaration);

        // ---------- SIGNATURES ----------
        Table signTable = new Table(UnitValue.createPercentArray(new float[]{1, 1, 1}))
                .useAllAvailableWidth()
                .setMarginTop(10f);

        signTable.addCell(makeCell("तारीख .......................", hindiFont, TextAlignment.LEFT, 12, false));
        signTable.addCell(makeCell("सन् ई० .......................", hindiFont, TextAlignment.CENTER, 12, false));
        signTable.addCell(makeCell("स्वीकार है\n\nहस्ताक्षर", hindiFont, TextAlignment.RIGHT, 12, false));
        doc.add(signTable);

        // ---------- FINISH ----------
        doc.close();
        System.out.println("✅ Wakalatnama PDF created successfully at: " + dest);
    }

    // ---------- Utility: Styled Cell ----------
    private static Cell makeCell(String text, PdfFont font, TextAlignment align, float size, boolean bold) {
        Paragraph p = new Paragraph(text).setFont(font).setFontSize(size).setTextAlignment(align);
        if (bold) p.setBold();
        return new Cell().add(p)
                .setBorder(Border.NO_BORDER)
                .setPadding(5)
                .setVerticalAlignment(VerticalAlignment.MIDDLE);
    }

    // ---------- Utility: Boxed Cell ----------
    private static Cell makeBox(String text, PdfFont font) {
        return new Cell().add(new Paragraph(text)
                        .setFont(font)
                        .setTextAlignment(TextAlignment.CENTER)
                        .setFontSize(12))
                .setBorder(new SolidBorder(ColorConstants.BLACK, 1))
                .setPadding(8);
    }
}



