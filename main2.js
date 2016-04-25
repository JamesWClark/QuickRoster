$(document).ready(function() {
    
    var tbyc, tbye, sbyc, sbye;
    
    var totalFiles = 4;
    var parsedFiles = 0;
    
    var progress = 0; // progress on the progress bar
    var progressBar = $('#progress-loading-files'); // the progress bar
    
    var courses = {};
    var students = {};
    var teachers = {};
    
    var next = function() {
        console.log('next');
        console.log(students);
    };
    
    var updateProgress = function() {
        progress += 12.5;
        progressBar.attr('value', progress);
    };
    
    var handleParse = function() {
        parsedFiles++;
        updateProgress();
        
        if(parsedFiles === totalFiles) {
            
            parseTeachersByEmail(tbye);
            updateProgress();
            
            parseTeachersByCourse(tbyc);
            updateProgress();
            
            parseStudentsByEmail(sbye);
            updateProgress();
            
            parseStudentsByCourse(sbyc);
            updateProgress();
            
            next();
        }
    };

    
    var parseTeachersByEmail = function(data) {
        data = data.split('\n');
    };
    
    var parseTeachersByCourse = function(data) {
        data = data.split('\n');
    };
    
    var parseStudentsByEmail = function(data) {
        data = data.split('\n');
    };
    
    var parseStudentsByCourse = function(data) {
        data = data.split('\n');
        data.forEach(function(item, index) {
            if(data.length > 0) {
                var csv = item.split(',');
                var course = {
                    id: csv[0],
                    name: csv[4],
                    term: csv[1]
                };
                var student = {
                    id: csv[8],
                    name: csv[3],
                    grade: csv[6]
                };
                courses[course.id] = course;
                students[student.id] = student;
            }
        });
    };
        
    // get the data from the files
    $.get('data/teachers_by_email.csv', function(data) {
        tbye = data;
        handleParse();
    });
    
    $.get('data/teachers_by_class.csv', function(data) {
        tbyc = data;
        handleParse();
    });

    $.get('data/students_by_email.csv', function(data) {
        sbye = data;
        handleParse();
    });

    $.get('data/students_by_class.csv', function(data) {
        sbyc = data;
        handleParse();
    });
});